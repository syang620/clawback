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

import { createDemoItems } from '@/constants/demo-data';
import {
  completeFinancialItem,
  restoreFinancialItem,
} from '@/features/financial-items/logic/status-transitions';
import { createManualFinancialItem } from '@/features/financial-items/logic/manual-entry';
import type {
  CreateFinancialItemInput,
  FinancialItem,
} from '@/types/financial-item';

const UNDO_DURATION_MS = 8_000;

export interface CompletionRecord {
  item: FinancialItem;
}

interface FinancialItemsContextValue {
  items: FinancialItem[];
  lastCompletion: CompletionRecord | null;
  completeItem: (id: string, completedAt?: Date) => boolean;
  createItem: (
    input: CreateFinancialItemInput,
    createdAt?: Date,
  ) => FinancialItem;
  dismissUndo: () => void;
  getItem: (id: string) => FinancialItem | null;
  undoLastCompletion: (restoredAt?: Date) => boolean;
}

interface FinancialItemsProviderProps extends PropsWithChildren {
  initialItems?: FinancialItem[];
  referenceDate?: Date;
}

const FinancialItemsContext = createContext<FinancialItemsContextValue | null>(
  null,
);

export function FinancialItemsProvider({
  children,
  initialItems,
  referenceDate,
}: FinancialItemsProviderProps) {
  const [items, setItems] = useState<FinancialItem[]>(() =>
    initialItems
      ? initialItems.slice()
      : createDemoItems(referenceDate ?? new Date()),
  );
  const [lastCompletion, setLastCompletion] = useState<CompletionRecord | null>(
    null,
  );
  const itemsRef = useRef(items);
  const manualItemSequenceRef = useRef(0);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createItem = useCallback(
    (input: CreateFinancialItemInput, createdAt = new Date()) => {
      manualItemSequenceRef.current += 1;
      const id = `manual-${createdAt.getTime()}-${manualItemSequenceRef.current}`;
      const item = createManualFinancialItem(input, id, createdAt);

      itemsRef.current = [...itemsRef.current, item];
      setItems((currentItems) => [...currentItems, item]);
      return item;
    },
    [],
  );

  const replaceItem = useCallback((nextItem: FinancialItem) => {
    itemsRef.current = itemsRef.current.map((item) =>
      item.id === nextItem.id ? nextItem : item,
    );
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === nextItem.id ? nextItem : item)),
    );
  }, []);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const dismissUndo = useCallback(() => {
    clearUndoTimer();
    setLastCompletion(null);
  }, [clearUndoTimer]);

  const completeItem = useCallback(
    (id: string, completedAt = new Date()) => {
      const currentItem = itemsRef.current.find((item) => item.id === id);
      if (!currentItem || currentItem.status !== 'active') return false;

      const completedItem = completeFinancialItem(currentItem, completedAt);
      replaceItem(completedItem);

      clearUndoTimer();
      setLastCompletion({ item: completedItem });
      undoTimerRef.current = setTimeout(() => {
        undoTimerRef.current = null;
        setLastCompletion(null);
      }, UNDO_DURATION_MS);
      return true;
    },
    [clearUndoTimer, replaceItem],
  );

  const undoLastCompletion = useCallback(
    (restoredAt = new Date()) => {
      if (!lastCompletion) return false;

      const currentItem = itemsRef.current.find(
        (item) => item.id === lastCompletion.item.id,
      );
      if (!currentItem || currentItem.status !== 'completed') {
        dismissUndo();
        return false;
      }

      const restoredItem = restoreFinancialItem(currentItem, restoredAt);
      replaceItem(restoredItem);
      dismissUndo();
      return true;
    },
    [dismissUndo, lastCompletion, replaceItem],
  );

  const getItem = useCallback(
    (id: string) => items.find((item) => item.id === id) ?? null,
    [items],
  );

  useEffect(() => clearUndoTimer, [clearUndoTimer]);

  const value = useMemo<FinancialItemsContextValue>(
    () => ({
      items,
      lastCompletion,
      completeItem,
      createItem,
      dismissUndo,
      getItem,
      undoLastCompletion,
    }),
    [
      completeItem,
      createItem,
      dismissUndo,
      getItem,
      items,
      lastCompletion,
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
