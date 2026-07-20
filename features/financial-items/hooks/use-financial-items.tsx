import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  isCanonicalDemoState,
  nextDemoSessionInteractionState,
} from '@/features/financial-items/logic/demo-state';
import { resolveSupabaseEnvironment } from '@/lib/supabase/environment';
import type { SupabaseEnvironment } from '@/lib/supabase/environment';
import { LocalFinancialItemsRepository } from '@/services/financial-items/local-financial-items-repository';
import type { FinancialItemsRepository } from '@/services/financial-items/repository';
import type {
  CreateFinancialItemInput,
  FinancialItem,
} from '@/types/financial-item';

const UNDO_DURATION_MS = 8_000;

export type FinancialItemsMode = 'demo' | 'connected';
export type FinancialItemsInitializationPhase =
  | 'authenticating'
  | 'seeding'
  | 'loading'
  | 'ready'
  | 'configuration-error'
  | 'auth-error'
  | 'seed-error'
  | 'read-error';
export type FinancialItemsMutationOperation = 'create' | 'complete' | 'restore';
export type FinancialItemPendingOperation = 'complete' | 'restore';

export interface FinancialItemsInitializationState {
  message?: string;
  phase: FinancialItemsInitializationPhase;
}

export interface FinancialItemsMutationError {
  id: string;
  itemId?: string;
  message: string;
  operation: FinancialItemsMutationOperation;
}

export interface CompletionRecord {
  item: FinancialItem;
  token: number;
}

export interface ConnectedFinancialItemsRuntime {
  release?: () => void;
  repository: FinancialItemsRepository;
}

export interface FinancialItemsProviderDependencies {
  createConnectedRuntime: (
    environment: Extract<SupabaseEnvironment, { mode: 'connected' }>,
  ) => Promise<ConnectedFinancialItemsRuntime>;
  createLocalRepository: (options: {
    initialItems?: FinancialItem[];
    referenceDate: Date;
  }) => FinancialItemsRepository;
  environment: SupabaseEnvironment;
}

interface FinancialItemsContextValue {
  completeItem: (id: string) => Promise<boolean>;
  createItem: (
    input: CreateFinancialItemInput,
  ) => Promise<FinancialItem | null>;
  dismissMutationError: (errorId: string) => void;
  dismissUndo: () => void;
  getItem: (id: string) => FinancialItem | null;
  initialization: FinancialItemsInitializationState;
  isCreating: boolean;
  isPristineDemoState: boolean;
  items: FinancialItem[];
  lastCompletion: CompletionRecord | null;
  mode: FinancialItemsMode | null;
  mutationErrors: FinancialItemsMutationError[];
  pendingItemOperations: Readonly<
    Record<string, FinancialItemPendingOperation>
  >;
  retryInitialization: () => void;
  undoLastCompletion: () => Promise<boolean>;
}

interface FinancialItemsProviderProps extends PropsWithChildren {
  dependencies?: FinancialItemsProviderDependencies;
  initialItems?: FinancialItem[];
  referenceDate?: Date;
}

interface MutationClaim {
  generation: number;
  key: string;
  token: number;
}

const mutationMessages: Record<FinancialItemsMutationOperation, string> = {
  create:
    'We could not save this task. Your entries are still here. Try again.',
  complete: 'We could not complete this task. Nothing was changed. Try again.',
  restore: 'We could not restore this task. It remains completed. Try again.',
};

const FinancialItemsContext = createContext<FinancialItemsContextValue | null>(
  null,
);

function createDefaultDependencies(): FinancialItemsProviderDependencies {
  return {
    environment: resolveSupabaseEnvironment(),
    createLocalRepository: (options) =>
      new LocalFinancialItemsRepository(options),
    createConnectedRuntime: async (environment) => {
      const [clientModule, lifecycleModule, authModule, repositoryModule] =
        await Promise.all([
          import('@/lib/supabase/client'),
          import('@/lib/supabase/auth-lifecycle'),
          import('@/services/supabase-auth'),
          import('@/services/financial-items/supabase-financial-items-repository'),
        ]);
      const client = clientModule.getSupabaseClient(environment);
      const release = lifecycleModule.acquireSupabaseAuthLifecycle(client);

      try {
        const session = await authModule.getOrCreateAnonymousSession(client);
        return {
          release,
          repository: new repositoryModule.SupabaseFinancialItemsRepository(
            client,
            session.user.id,
          ),
        };
      } catch (error) {
        release();
        throw error;
      }
    },
  };
}

function initializationError(
  phase: Exclude<
    FinancialItemsInitializationPhase,
    'authenticating' | 'seeding' | 'loading' | 'ready'
  >,
  message: string,
): FinancialItemsInitializationState {
  return { phase, message };
}

export function FinancialItemsProvider({
  children,
  dependencies,
  initialItems,
  referenceDate,
}: FinancialItemsProviderProps) {
  const runtimeDependencies = useMemo(
    () => dependencies ?? createDefaultDependencies(),
    [dependencies],
  );
  const referenceDateRef = useRef(referenceDate ?? new Date());
  const [items, setItems] = useState<FinancialItem[]>([]);
  const [mode, setMode] = useState<FinancialItemsMode | null>(null);
  const [initialization, setInitialization] =
    useState<FinancialItemsInitializationState>({ phase: 'loading' });
  const [lastCompletion, setLastCompletion] = useState<CompletionRecord | null>(
    null,
  );
  const [mutationErrors, setMutationErrors] = useState<
    FinancialItemsMutationError[]
  >([]);
  const [pendingItemOperations, setPendingItemOperations] = useState<
    Record<string, FinancialItemPendingOperation>
  >({});
  const [isCreating, setIsCreating] = useState(false);
  const [hasMeaningfullyInteractedThisSession, setHasMeaningfullyInteracted] =
    useState(false);

  const itemsRef = useRef<FinancialItem[]>([]);
  const repositoryRef = useRef<FinancialItemsRepository | null>(null);
  const lifecycleReleaseRef = useRef<(() => void) | null>(null);
  const initializationGenerationRef = useRef(0);
  const mutationSequenceRef = useRef(0);
  const completionSequenceRef = useRef(0);
  const activeMutationTokensRef = useRef(new Map<string, number>());
  const pendingMutationKeysRef = useRef(new Set<string>());
  const lastCompletionRef = useRef<CompletionRecord | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const setCompletionRecord = useCallback((record: CompletionRecord | null) => {
    lastCompletionRef.current = record;
    setLastCompletion(record);
  }, []);

  const dismissMutationError = useCallback((errorId: string) => {
    setMutationErrors((current) =>
      current.filter((error) => error.id !== errorId),
    );
  }, []);

  const clearMutationErrorFor = useCallback(
    (operation: FinancialItemsMutationOperation, itemId?: string) => {
      setMutationErrors((current) =>
        current.filter(
          (error) => error.operation !== operation || error.itemId !== itemId,
        ),
      );
    },
    [],
  );

  const resetMutationState = useCallback(() => {
    activeMutationTokensRef.current.clear();
    pendingMutationKeysRef.current.clear();
    setPendingItemOperations({});
    setIsCreating(false);
    setMutationErrors([]);
  }, []);

  const beginMutation = useCallback(
    (
      key: string,
      operation: FinancialItemsMutationOperation,
      itemId?: string,
    ): MutationClaim | null => {
      if (pendingMutationKeysRef.current.has(key)) return null;

      pendingMutationKeysRef.current.add(key);
      mutationSequenceRef.current += 1;
      const token = mutationSequenceRef.current;
      activeMutationTokensRef.current.set(key, token);
      clearMutationErrorFor(operation, itemId);

      if (operation === 'create') setIsCreating(true);
      else if (itemId) {
        setPendingItemOperations((current) => ({
          ...current,
          [itemId]: operation,
        }));
      }

      return {
        generation: initializationGenerationRef.current,
        key,
        token,
      };
    },
    [clearMutationErrorFor],
  );

  const isClaimCurrent = useCallback((claim: MutationClaim): boolean => {
    return (
      claim.generation === initializationGenerationRef.current &&
      activeMutationTokensRef.current.get(claim.key) === claim.token
    );
  }, []);

  const finishMutation = useCallback(
    (claim: MutationClaim, itemId?: string) => {
      if (activeMutationTokensRef.current.get(claim.key) !== claim.token) {
        return;
      }

      activeMutationTokensRef.current.delete(claim.key);
      pendingMutationKeysRef.current.delete(claim.key);
      if (claim.key === 'create') setIsCreating(false);
      else if (itemId) {
        setPendingItemOperations((current) => {
          const next = { ...current };
          delete next[itemId];
          return next;
        });
      }
    },
    [],
  );

  const publishMutationError = useCallback(
    (
      claim: MutationClaim,
      operation: FinancialItemsMutationOperation,
      itemId?: string,
    ) => {
      if (!isClaimCurrent(claim)) return;

      const error: FinancialItemsMutationError = {
        id: `mutation-${claim.generation}-${claim.token}`,
        operation,
        itemId,
        message: mutationMessages[operation],
      };
      setMutationErrors((current) => [
        ...current.filter(
          (candidate) =>
            candidate.operation !== operation || candidate.itemId !== itemId,
        ),
        error,
      ]);
    },
    [isClaimCurrent],
  );

  const replaceItem = useCallback((nextItem: FinancialItem) => {
    const nextItems = itemsRef.current.map((item) =>
      item.id === nextItem.id ? nextItem : item,
    );
    itemsRef.current = nextItems;
    setItems(nextItems);
  }, []);

  const scheduleUndoDismissal = useCallback(
    (record: CompletionRecord) => {
      clearUndoTimer();
      undoTimerRef.current = setTimeout(() => {
        undoTimerRef.current = null;
        if (lastCompletionRef.current?.token !== record.token) return;

        setCompletionRecord(null);
        setMutationErrors((current) =>
          current.filter(
            (error) =>
              error.operation !== 'restore' || error.itemId !== record.item.id,
          ),
        );
      }, UNDO_DURATION_MS);
    },
    [clearUndoTimer, setCompletionRecord],
  );

  const runInitialization = useCallback(async () => {
    initializationGenerationRef.current += 1;
    const generation = initializationGenerationRef.current;
    repositoryRef.current = null;
    setMode(null);
    itemsRef.current = [];
    setItems([]);
    clearUndoTimer();
    setCompletionRecord(null);
    resetMutationState();

    const environment = runtimeDependencies.environment;
    if (environment.mode === 'error') {
      setInitialization(
        initializationError('configuration-error', environment.message),
      );
      return;
    }

    let phase: 'authenticating' | 'seeding' | 'loading' = 'loading';
    let connectedRuntime: ConnectedFinancialItemsRuntime | null = null;

    try {
      let repository: FinancialItemsRepository;
      if (environment.mode === 'demo') {
        setInitialization({ phase: 'loading' });
        repository = runtimeDependencies.createLocalRepository({
          initialItems,
          referenceDate: referenceDateRef.current,
        });
      } else {
        phase = 'authenticating';
        setInitialization({ phase });
        connectedRuntime =
          await runtimeDependencies.createConnectedRuntime(environment);
        if (generation !== initializationGenerationRef.current) {
          connectedRuntime.release?.();
          return;
        }

        lifecycleReleaseRef.current?.();
        lifecycleReleaseRef.current = connectedRuntime.release ?? null;
        repository = connectedRuntime.repository;

        phase = 'seeding';
        setInitialization({ phase });
        await repository.ensureInitialSeed(referenceDateRef.current);
        if (generation !== initializationGenerationRef.current) return;
      }

      phase = 'loading';
      setInitialization({ phase });
      const loadedItems = await repository.listItems();
      if (generation !== initializationGenerationRef.current) return;

      repositoryRef.current = repository;
      itemsRef.current = loadedItems;
      setItems(loadedItems);
      setMode(environment.mode);
      setInitialization({ phase: 'ready' });
    } catch {
      if (generation !== initializationGenerationRef.current) {
        connectedRuntime?.release?.();
        return;
      }

      if (phase === 'authenticating') {
        setInitialization(
          initializationError(
            'auth-error',
            'We could not connect securely. Check your connection and try again.',
          ),
        );
      } else if (phase === 'seeding') {
        setInitialization(
          initializationError(
            'seed-error',
            'We could not prepare your tasks. Nothing was changed. Try again.',
          ),
        );
      } else {
        setInitialization(
          initializationError(
            'read-error',
            'We could not load your tasks. Check your connection and try again.',
          ),
        );
      }
    }
  }, [
    clearUndoTimer,
    initialItems,
    resetMutationState,
    runtimeDependencies,
    setCompletionRecord,
  ]);

  useEffect(() => {
    void runInitialization();
    return () => {
      initializationGenerationRef.current += 1;
      clearUndoTimer();
      lifecycleReleaseRef.current?.();
      lifecycleReleaseRef.current = null;
    };
  }, [clearUndoTimer, runInitialization]);

  const createItem = useCallback(
    async (input: CreateFinancialItemInput) => {
      const repository = repositoryRef.current;
      if (!repository || initialization.phase !== 'ready') return null;

      const claim = beginMutation('create', 'create');
      if (!claim) return null;

      try {
        const createdItem = await repository.createItem(input);
        if (!isClaimCurrent(claim)) return null;

        const nextItems = [...itemsRef.current, createdItem];
        itemsRef.current = nextItems;
        setItems(nextItems);
        setHasMeaningfullyInteracted((current) =>
          nextDemoSessionInteractionState(
            current,
            'meaningful-mutation-succeeded',
          ),
        );
        return createdItem;
      } catch {
        publishMutationError(claim, 'create');
        return null;
      } finally {
        finishMutation(claim);
      }
    },
    [
      beginMutation,
      finishMutation,
      initialization.phase,
      isClaimCurrent,
      publishMutationError,
    ],
  );

  const completeItem = useCallback(
    async (id: string) => {
      const repository = repositoryRef.current;
      const currentItem = itemsRef.current.find((item) => item.id === id);
      if (
        !repository ||
        initialization.phase !== 'ready' ||
        currentItem?.status !== 'active'
      ) {
        return false;
      }

      const key = `item:${id}`;
      const claim = beginMutation(key, 'complete', id);
      if (!claim) return false;

      try {
        const completedItem = await repository.completeItem(id);
        if (
          !completedItem ||
          completedItem.id !== id ||
          completedItem.status !== 'completed' ||
          !isClaimCurrent(claim)
        ) {
          if (isClaimCurrent(claim)) {
            publishMutationError(claim, 'complete', id);
          }
          return false;
        }

        replaceItem(completedItem);
        completionSequenceRef.current += 1;
        const record = {
          item: completedItem,
          token: completionSequenceRef.current,
        };
        setCompletionRecord(record);
        scheduleUndoDismissal(record);
        setHasMeaningfullyInteracted((current) =>
          nextDemoSessionInteractionState(
            current,
            'meaningful-mutation-succeeded',
          ),
        );
        return true;
      } catch {
        publishMutationError(claim, 'complete', id);
        return false;
      } finally {
        finishMutation(claim, id);
      }
    },
    [
      beginMutation,
      finishMutation,
      initialization.phase,
      isClaimCurrent,
      publishMutationError,
      replaceItem,
      scheduleUndoDismissal,
      setCompletionRecord,
    ],
  );

  const dismissUndo = useCallback(() => {
    const record = lastCompletionRef.current;
    if (
      record &&
      pendingMutationKeysRef.current.has(`item:${record.item.id}`)
    ) {
      return;
    }

    clearUndoTimer();
    setCompletionRecord(null);
  }, [clearUndoTimer, setCompletionRecord]);

  const undoLastCompletion = useCallback(async () => {
    const repository = repositoryRef.current;
    const record = lastCompletionRef.current;
    if (!repository || !record || initialization.phase !== 'ready') {
      return false;
    }

    const currentItem = itemsRef.current.find(
      (item) => item.id === record.item.id,
    );
    if (currentItem?.status !== 'completed') return false;

    const id = record.item.id;
    const claim = beginMutation(`item:${id}`, 'restore', id);
    if (!claim) return false;
    clearUndoTimer();

    try {
      const restoredItem = await repository.restoreItem(id);
      if (
        !restoredItem ||
        restoredItem.id !== id ||
        restoredItem.status !== 'active' ||
        !isClaimCurrent(claim)
      ) {
        if (isClaimCurrent(claim)) {
          publishMutationError(claim, 'restore', id);
          if (lastCompletionRef.current?.token === record.token) {
            scheduleUndoDismissal(record);
          }
        }
        return false;
      }

      replaceItem(restoredItem);
      if (lastCompletionRef.current?.token === record.token) {
        setCompletionRecord(null);
      }
      return true;
    } catch {
      publishMutationError(claim, 'restore', id);
      if (lastCompletionRef.current?.token === record.token) {
        scheduleUndoDismissal(record);
      }
      return false;
    } finally {
      finishMutation(claim, id);
    }
  }, [
    beginMutation,
    clearUndoTimer,
    finishMutation,
    initialization.phase,
    isClaimCurrent,
    publishMutationError,
    replaceItem,
    scheduleUndoDismissal,
    setCompletionRecord,
  ]);

  const getItem = useCallback(
    (id: string) => items.find((item) => item.id === id) ?? null,
    [items],
  );

  const isPristineDemoState = useMemo(
    () =>
      initialization.phase === 'ready' &&
      !hasMeaningfullyInteractedThisSession &&
      isCanonicalDemoState(items, referenceDateRef.current),
    [hasMeaningfullyInteractedThisSession, initialization.phase, items],
  );

  const value = useMemo<FinancialItemsContextValue>(
    () => ({
      completeItem,
      createItem,
      dismissMutationError,
      dismissUndo,
      getItem,
      initialization,
      isCreating,
      isPristineDemoState,
      items,
      lastCompletion,
      mode,
      mutationErrors,
      pendingItemOperations,
      retryInitialization: runInitialization,
      undoLastCompletion,
    }),
    [
      completeItem,
      createItem,
      dismissMutationError,
      dismissUndo,
      getItem,
      initialization,
      isCreating,
      isPristineDemoState,
      items,
      lastCompletion,
      mode,
      mutationErrors,
      pendingItemOperations,
      runInitialization,
      undoLastCompletion,
    ],
  );

  return (
    <FinancialItemsContext.Provider value={value}>
      {children}
    </FinancialItemsContext.Provider>
  );
}

export function useFinancialItems(): FinancialItemsContextValue {
  const context = useContext(FinancialItemsContext);
  if (!context) {
    throw new Error(
      'useFinancialItems must be used within FinancialItemsProvider.',
    );
  }
  return context;
}
