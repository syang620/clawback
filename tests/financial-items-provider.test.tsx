import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Text } from 'react-native';

import { UndoBanner } from '@/components/undo-banner';
import { createDemoItems } from '@/constants/demo-data';
import { completeWithFeedback } from '@/features/financial-items/hooks/use-complete-with-feedback';
import {
  FinancialItemsProvider,
  type FinancialItemsProviderDependencies,
  useFinancialItems,
} from '@/features/financial-items/hooks/use-financial-items';
import { calculateDashboardMetrics } from '@/features/financial-items/logic/dashboard';
import { rankFinancialItems } from '@/features/financial-items/logic/urgency';
import { LocalFinancialItemsRepository } from '@/services/financial-items/local-financial-items-repository';
import type { FinancialItemsRepository } from '@/services/financial-items/repository';
import type {
  CreateFinancialItemInput,
  FinancialItem,
} from '@/types/financial-item';

const referenceDate = new Date('2026-07-16T00:00:00.000Z');
const manualPerkInput: CreateFinancialItemInput = {
  kind: 'perk',
  title: 'Use new credit',
  provider: 'Example Card',
  valueCents: 2_000,
  chargeAmountCents: null,
  dueAt: '2026-07-17T12:00:00.000Z',
  recurrence: 'monthly',
  actionUrl: null,
  source: 'manual',
  extractionConfidence: null,
};

function dependenciesFor(
  repository: FinancialItemsRepository,
): FinancialItemsProviderDependencies {
  return {
    environment: { mode: 'demo' },
    createLocalRepository: () => repository,
    createConnectedRuntime: jest.fn(),
  };
}

function ProviderHarness({
  capture,
}: {
  capture: (value: ReturnType<typeof useFinancialItems>) => void;
}) {
  const context = useFinancialItems();
  capture(context);
  const metrics = calculateDashboardMetrics(context.items);
  const ranked = rankFinancialItems(context.items, referenceDate);

  return (
    <>
      <Text>{`Phase ${context.initialization.phase}`}</Text>
      <Text>{`Mode ${context.mode ?? 'none'}`}</Text>
      <Text>{`Pristine ${context.isPristineDemoState}`}</Text>
      <Text>{`Items ${context.items.length}`}</Text>
      <Text>{`Available ${metrics.availableCents}`}</Text>
      <Text>{`At risk ${metrics.atRiskCents}`}</Text>
      <Text>{`Clawed back ${metrics.clawedBackCents}`}</Text>
      <Text>{`First ${ranked[0]?.title ?? 'none'}`}</Text>
      <Text>{`Errors ${context.mutationErrors.length}`}</Text>
      <Text>{`Error message ${context.mutationErrors[0]?.message ?? 'none'}`}</Text>
      <Text>{`Pending ${Object.keys(context.pendingItemOperations).length}`}</Text>
      <Text>{`Resetting ${context.isResettingLocalDemo}`}</Text>
      <Text>{`Activity ${context.items.filter((item) => item.status !== 'active').length}`}</Text>
    </>
  );
}

async function renderProvider(repository: FinancialItemsRepository) {
  return renderProviderWithDependencies(dependenciesFor(repository));
}

async function renderProviderWithDependencies(
  dependencies: FinancialItemsProviderDependencies,
) {
  let context = undefined as unknown as ReturnType<typeof useFinancialItems>;
  const view = render(
    <FinancialItemsProvider
      dependencies={dependencies}
      referenceDate={referenceDate}
    >
      <ProviderHarness capture={(value) => (context = value)} />
      <UndoBanner />
    </FinancialItemsProvider>,
  );
  await waitFor(() => expect(screen.getByText('Phase ready')).toBeTruthy());
  return { context, view };
}

describe('Checkpoint 4B shared financial-item state', () => {
  it('uses one pessimistic completion path, blocks rapid duplicates, and haptics once', async () => {
    const repository = new LocalFinancialItemsRepository({
      initialItems: createDemoItems(referenceDate),
      clock: () => new Date('2026-07-17T12:00:00.000Z'),
    });
    const completeSpy = jest.spyOn(repository, 'completeItem');
    const feedback = jest.fn().mockResolvedValue(true);
    const { context } = await renderProvider(repository);

    let results: boolean[] = [];
    await act(async () => {
      results = await Promise.all([
        completeWithFeedback(
          () => context.completeItem('founderscard-trial'),
          feedback,
        ),
        completeWithFeedback(
          () => context.completeItem('founderscard-trial'),
          feedback,
        ),
      ]);
    });

    expect(results).toEqual([true, false]);
    expect(completeSpy).toHaveBeenCalledTimes(1);
    expect(feedback).toHaveBeenCalledTimes(1);
    expect(screen.getByText('At risk 0')).toBeTruthy();
    expect(screen.getByText('Clawed back 59500')).toBeTruthy();
    expect(screen.getByText('Pristine false')).toBeTruthy();

    await act(async () => {
      await context.undoLastCompletion();
    });
    expect(screen.getByText('At risk 59500')).toBeTruthy();
    expect(screen.getByText('Clawed back 0')).toBeTruthy();
    expect(screen.getByText('Pristine false')).toBeTruthy();
  });

  it('adds only the committed manual item and updates metrics and ranking', async () => {
    const repository = new LocalFinancialItemsRepository({
      initialItems: createDemoItems(referenceDate),
      clock: () => new Date('2026-07-18T12:00:00.000Z'),
    });
    const createSpy = jest.spyOn(repository, 'createItem');
    const { context } = await renderProvider(repository);

    let results: Array<FinancialItem | null> = [];
    await act(async () => {
      results = await Promise.all([
        context.createItem(manualPerkInput),
        context.createItem(manualPerkInput),
      ]);
    });

    expect(results[0]).not.toBeNull();
    expect(results[1]).toBeNull();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Items 4')).toBeTruthy();
    expect(screen.getByText('Available 7700')).toBeTruthy();
    expect(screen.getByText('First Use new credit')).toBeTruthy();
    expect(screen.getByText('Pristine false')).toBeTruthy();
  });

  it('passes validated email provenance through the provider unchanged', async () => {
    const repository = new LocalFinancialItemsRepository({ initialItems: [] });
    const createSpy = jest.spyOn(repository, 'createItem');
    const { context } = await renderProvider(repository);

    let created: FinancialItem | null = null;
    await act(async () => {
      created = await context.createItem({
        ...manualPerkInput,
        source: 'email',
        extractionConfidence: 0.7,
      });
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'email',
        extractionConfidence: 0.7,
      }),
    );
    expect(created).toMatchObject({
      source: 'email',
      extractionConfidence: 0.7,
    });
  });

  it('keeps visible state unchanged and exposes a safe error after a write failure', async () => {
    const items = createDemoItems(referenceDate);
    const privateFailure = new Error('private backend details');
    const repository: FinancialItemsRepository = {
      listItems: jest.fn().mockResolvedValue(items),
      getItem: jest.fn(),
      createItem: jest.fn(),
      updateItem: jest.fn(),
      completeItem: jest.fn().mockRejectedValue(privateFailure),
      restoreItem: jest.fn(),
      deleteItem: jest.fn(),
      ensureInitialSeed: jest.fn(),
    };
    const feedback = jest.fn().mockResolvedValue(true);
    const { context } = await renderProvider(repository);

    await act(async () => {
      await completeWithFeedback(
        () => context.completeItem('founderscard-trial'),
        feedback,
      );
    });

    expect(screen.getByText('At risk 59500')).toBeTruthy();
    expect(screen.getByText('Clawed back 0')).toBeTruthy();
    expect(screen.getByText('Errors 1')).toBeTruthy();
    expect(screen.queryByText(new RegExp(privateFailure.message))).toBeNull();
    expect(
      screen.getByText(
        'Error message We could not complete this task. Nothing was changed. Try again.',
      ),
    ).toBeTruthy();
    expect(feedback).not.toHaveBeenCalled();
    expect(screen.getByText('Pristine true')).toBeTruthy();
  });

  it('does not restore pristine visibility when the route remounts after Undo', async () => {
    const repository = new LocalFinancialItemsRepository({
      initialItems: createDemoItems(referenceDate),
      clock: () => new Date('2026-07-17T12:00:00.000Z'),
    });
    const dependencies = dependenciesFor(repository);
    let context = undefined as unknown as ReturnType<typeof useFinancialItems>;

    function RouteProbe({ visible }: { visible: boolean }) {
      const value = useFinancialItems();
      context = value;
      return visible ? (
        <Text>{`Route pristine ${value.isPristineDemoState}`}</Text>
      ) : (
        <Text>Route away</Text>
      );
    }

    const view = render(
      <FinancialItemsProvider
        dependencies={dependencies}
        referenceDate={referenceDate}
      >
        <RouteProbe visible />
      </FinancialItemsProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText('Route pristine true')).toBeTruthy(),
    );

    await act(async () => {
      await context.completeItem('founderscard-trial');
      await context.undoLastCompletion();
    });
    expect(screen.getByText('Route pristine false')).toBeTruthy();

    view.rerender(
      <FinancialItemsProvider
        dependencies={dependencies}
        referenceDate={referenceDate}
      >
        <RouteProbe visible={false} />
      </FinancialItemsProvider>,
    );
    expect(screen.getByText('Route away')).toBeTruthy();

    view.rerender(
      <FinancialItemsProvider
        dependencies={dependencies}
        referenceDate={referenceDate}
      >
        <RouteProbe visible />
      </FinancialItemsProvider>,
    );
    expect(screen.getByText('Route pristine false')).toBeTruthy();
  });

  it('keeps Undo visible during a late restore and grants a fresh window after failure', async () => {
    const items = createDemoItems(referenceDate);
    let rejectRestore: ((error: Error) => void) | null = null;
    const local = new LocalFinancialItemsRepository({
      initialItems: items,
      clock: () => new Date('2026-07-17T12:00:00.000Z'),
    });
    const repository: FinancialItemsRepository = {
      listItems: () => local.listItems(),
      getItem: (id) => local.getItem(id),
      createItem: (input) => local.createItem(input),
      updateItem: (id, input) => local.updateItem(id, input),
      completeItem: (id) => local.completeItem(id),
      restoreItem: jest.fn(
        () =>
          new Promise<FinancialItem | null>((_resolve, reject) => {
            rejectRestore = reject;
          }),
      ),
      deleteItem: (id) => local.deleteItem(id),
      ensureInitialSeed: () => local.ensureInitialSeed(),
    };
    const { context, view } = await renderProvider(repository);
    jest.useFakeTimers();

    await act(async () => {
      await context.completeItem('founderscard-trial');
    });
    expect(screen.getByText('Undo')).toBeTruthy();

    act(() => jest.advanceTimersByTime(7_900));
    let restorePromise: Promise<boolean>;
    act(() => {
      restorePromise = context.undoLastCompletion();
    });
    expect(screen.getByText('Restoring…')).toBeTruthy();
    let didReset = true;
    await act(async () => {
      didReset = await context.resetLocalDemo();
    });
    expect(didReset).toBe(false);
    act(() => jest.advanceTimersByTime(1_000));
    expect(screen.getByText('Restoring…')).toBeTruthy();

    await act(async () => {
      rejectRestore?.(new Error('restore failed'));
      await restorePromise!;
    });
    expect(screen.getByText('Undo')).toBeTruthy();
    expect(
      screen.getByText(
        'We could not restore this task. It remains completed. Try again.',
      ),
    ).toBeTruthy();

    act(() => jest.advanceTimersByTime(7_999));
    expect(screen.getByText('Undo')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByText('Undo')).toBeNull();

    view.unmount();
    jest.useRealTimers();
  });

  it('ignores a stale mutation failure after a newer initialization succeeds', async () => {
    const items = createDemoItems(referenceDate);
    let rejectCompletion: (error: Error) => void = () => undefined;
    const repository: FinancialItemsRepository = {
      listItems: jest.fn().mockResolvedValue(items),
      getItem: jest.fn(),
      createItem: jest.fn(),
      updateItem: jest.fn(),
      completeItem: jest.fn(
        () =>
          new Promise<FinancialItem | null>((_resolve, reject) => {
            rejectCompletion = reject;
          }),
      ),
      restoreItem: jest.fn(),
      deleteItem: jest.fn(),
      ensureInitialSeed: jest.fn(),
    };
    const { context } = await renderProvider(repository);

    let completionPromise: Promise<boolean>;
    act(() => {
      completionPromise = context.completeItem('founderscard-trial');
    });
    expect(screen.getByText('Pending 1')).toBeTruthy();

    act(() => {
      context.retryInitialization();
    });
    await waitFor(() => expect(repository.listItems).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText('Phase ready')).toBeTruthy());
    await act(async () => {
      rejectCompletion(new Error('stale private failure'));
      await completionPromise!;
    });

    expect(screen.getByText('Errors 0')).toBeTruthy();
    expect(screen.getByText('At risk 59500')).toBeTruthy();
  });

  it('atomically resets only Local demo state to canonical seeds', async () => {
    const dirtyItems = createDemoItems(referenceDate);
    dirtyItems[2] = { ...dirtyItems[2], status: 'expired' };
    const dirtyRepository = new LocalFinancialItemsRepository({
      initialItems: dirtyItems,
      clock: () => new Date('2026-07-18T12:00:00.000Z'),
    });
    const originalComplete = dirtyRepository.completeItem.bind(dirtyRepository);
    const completeSpy = jest
      .spyOn(dirtyRepository, 'completeItem')
      .mockImplementation((id) =>
        id === 'amex-gold-dunkin-credit'
          ? Promise.reject(new Error('private write failure'))
          : originalComplete(id),
      );
    const deleteSpy = jest.spyOn(dirtyRepository, 'deleteItem');
    const createConnectedRuntime = jest.fn();
    const replacementRepositories: LocalFinancialItemsRepository[] = [];
    const createLocalRepository = jest
      .fn()
      .mockReturnValueOnce(dirtyRepository)
      .mockImplementation((options: { referenceDate: Date }) => {
        const replacementRepository = new LocalFinancialItemsRepository({
          referenceDate: options.referenceDate,
          clock: () => new Date('2026-07-18T12:00:00.000Z'),
        });
        replacementRepositories.push(replacementRepository);
        return replacementRepository;
      });
    const { context } = await renderProviderWithDependencies({
      environment: { mode: 'demo' },
      createLocalRepository,
      createConnectedRuntime,
    });

    await act(async () => {
      await context.createItem(manualPerkInput);
      await context.completeItem('founderscard-trial');
      await context.completeItem('amex-gold-dunkin-credit');
    });
    expect(screen.getByText('Items 4')).toBeTruthy();
    expect(screen.getByText('Activity 2')).toBeTruthy();
    expect(screen.getByText('Errors 1')).toBeTruthy();
    expect(screen.getByText('Undo')).toBeTruthy();
    expect(screen.getByText('Pristine false')).toBeTruthy();

    let didReset = false;
    await act(async () => {
      didReset = await context.resetLocalDemo();
    });

    expect(didReset).toBe(true);
    expect(screen.getByText('Items 3')).toBeTruthy();
    expect(screen.getByText('Available 5700')).toBeTruthy();
    expect(screen.getByText('At risk 59500')).toBeTruthy();
    expect(screen.getByText('Clawed back 0')).toBeTruthy();
    expect(screen.getByText('Activity 0')).toBeTruthy();
    expect(screen.getByText('Errors 0')).toBeTruthy();
    expect(screen.queryByText('Undo')).toBeNull();
    expect(screen.getByText('Pending 0')).toBeTruthy();
    expect(screen.getByText('Pristine true')).toBeTruthy();
    await expect(replacementRepositories[0].listItems()).resolves.toEqual(
      createDemoItems(referenceDate),
    );
    expect(createLocalRepository).toHaveBeenLastCalledWith({ referenceDate });
    expect(createLocalRepository).toHaveBeenCalledTimes(2);
    expect(completeSpy).toHaveBeenCalledTimes(2);
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(createConnectedRuntime).not.toHaveBeenCalled();
  });

  it('guards duplicate reset and refuses to replace state during an in-flight mutation', async () => {
    const initialRepository = new LocalFinancialItemsRepository({
      referenceDate,
      clock: () => new Date('2026-07-18T12:00:00.000Z'),
    });
    const originalComplete =
      initialRepository.completeItem.bind(initialRepository);
    let resolveCompletion: (() => Promise<void>) | null = null;
    jest.spyOn(initialRepository, 'completeItem').mockImplementation(
      (id) =>
        new Promise<FinancialItem | null>((resolve) => {
          resolveCompletion = async () => resolve(await originalComplete(id));
        }),
    );

    const replacementRepository = new LocalFinancialItemsRepository({
      referenceDate,
    });
    let resolveReplacement: ((items: FinancialItem[]) => void) | null = null;
    jest.spyOn(replacementRepository, 'listItems').mockImplementation(
      () =>
        new Promise<FinancialItem[]>((resolve) => {
          resolveReplacement = resolve;
        }),
    );
    const createLocalRepository = jest
      .fn()
      .mockReturnValueOnce(initialRepository)
      .mockReturnValue(replacementRepository);
    const { context } = await renderProviderWithDependencies({
      environment: { mode: 'demo' },
      createLocalRepository,
      createConnectedRuntime: jest.fn(),
    });

    let completionPromise: Promise<boolean>;
    act(() => {
      completionPromise = context.completeItem('founderscard-trial');
    });
    expect(screen.getByText('Pending 1')).toBeTruthy();
    await expect(context.resetLocalDemo()).resolves.toBe(false);
    expect(createLocalRepository).toHaveBeenCalledTimes(1);

    await act(async () => {
      await resolveCompletion?.();
      await completionPromise!;
    });

    let firstReset: Promise<boolean>;
    let duplicateReset: Promise<boolean>;
    act(() => {
      firstReset = context.resetLocalDemo();
      duplicateReset = context.resetLocalDemo();
    });
    expect(screen.getByText('Items 3')).toBeTruthy();
    expect(screen.getByText('Activity 1')).toBeTruthy();
    await expect(duplicateReset!).resolves.toBe(false);
    expect(createLocalRepository).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveReplacement?.(createDemoItems(referenceDate));
      await firstReset!;
    });
    await expect(firstReset!).resolves.toBe(true);
    expect(screen.getByText('Pristine true')).toBeTruthy();
  });

  it('preserves the current repository and all visible state when replacement validation fails', async () => {
    const currentRepository = new LocalFinancialItemsRepository({
      referenceDate,
      clock: () => new Date('2026-07-18T12:00:00.000Z'),
    });
    const originalComplete =
      currentRepository.completeItem.bind(currentRepository);
    jest
      .spyOn(currentRepository, 'completeItem')
      .mockImplementation((id) =>
        id === 'amex-gold-dunkin-credit'
          ? Promise.reject(new Error('private failure'))
          : originalComplete(id),
      );
    const createSpy = jest.spyOn(currentRepository, 'createItem');
    const invalidReplacement = new LocalFinancialItemsRepository({
      initialItems: createDemoItems(referenceDate).slice(0, 2),
    });
    const createLocalRepository = jest
      .fn()
      .mockReturnValueOnce(currentRepository)
      .mockReturnValueOnce(invalidReplacement);
    const { context } = await renderProviderWithDependencies({
      environment: { mode: 'demo' },
      createLocalRepository,
      createConnectedRuntime: jest.fn(),
    });

    await act(async () => {
      await context.createItem(manualPerkInput);
      await context.completeItem('founderscard-trial');
      await context.completeItem('amex-gold-dunkin-credit');
    });
    expect(screen.getByText('Items 4')).toBeTruthy();
    expect(screen.getByText('At risk 0')).toBeTruthy();
    expect(screen.getByText('Clawed back 59500')).toBeTruthy();
    expect(screen.getByText('Activity 1')).toBeTruthy();
    expect(screen.getByText('Errors 1')).toBeTruthy();
    expect(screen.getByText('Undo')).toBeTruthy();
    expect(screen.getByText('Pristine false')).toBeTruthy();

    let didReset = true;
    await act(async () => {
      didReset = await context.resetLocalDemo();
    });
    expect(didReset).toBe(false);

    expect(screen.getByText('Items 4')).toBeTruthy();
    expect(screen.getByText('At risk 0')).toBeTruthy();
    expect(screen.getByText('Clawed back 59500')).toBeTruthy();
    expect(screen.getByText('Activity 1')).toBeTruthy();
    expect(screen.getByText('Errors 1')).toBeTruthy();
    expect(screen.getByText('Undo')).toBeTruthy();
    expect(screen.getByText('Pristine false')).toBeTruthy();

    await act(async () => {
      await context.createItem({ ...manualPerkInput, title: 'After failure' });
    });
    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Items 5')).toBeTruthy();
  });

  it('fails reset closed while create or initialization retry is in flight', async () => {
    const currentRepository = new LocalFinancialItemsRepository({
      referenceDate,
    });
    const originalCreate = currentRepository.createItem.bind(currentRepository);
    let resolveCreate: (() => Promise<void>) | null = null;
    jest.spyOn(currentRepository, 'createItem').mockImplementation(
      (input) =>
        new Promise<FinancialItem>((resolve) => {
          resolveCreate = async () => resolve(await originalCreate(input));
        }),
    );
    const retryRepository = new LocalFinancialItemsRepository({
      referenceDate,
    });
    let resolveRetryLoad: ((items: FinancialItem[]) => void) | null = null;
    jest.spyOn(retryRepository, 'listItems').mockImplementation(
      () =>
        new Promise<FinancialItem[]>((resolve) => {
          resolveRetryLoad = resolve;
        }),
    );
    const replacementRepository = new LocalFinancialItemsRepository({
      referenceDate,
    });
    const createLocalRepository = jest
      .fn()
      .mockReturnValueOnce(currentRepository)
      .mockReturnValueOnce(retryRepository)
      .mockReturnValueOnce(replacementRepository);
    const { context } = await renderProviderWithDependencies({
      environment: { mode: 'demo' },
      createLocalRepository,
      createConnectedRuntime: jest.fn(),
    });

    let createPromise: Promise<FinancialItem | null>;
    act(() => {
      createPromise = context.createItem(manualPerkInput);
    });
    expect(screen.getByText('Resetting false')).toBeTruthy();
    await expect(context.resetLocalDemo()).resolves.toBe(false);
    expect(createLocalRepository).toHaveBeenCalledTimes(1);
    await act(async () => {
      await resolveCreate?.();
      await createPromise!;
    });

    act(() => {
      context.retryInitialization();
    });
    await expect(context.resetLocalDemo()).resolves.toBe(false);
    expect(createLocalRepository).toHaveBeenCalledTimes(2);
    await act(async () => {
      resolveRetryLoad?.(createDemoItems(referenceDate));
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByText('Phase ready')).toBeTruthy());

    let didReset = false;
    await act(async () => {
      didReset = await context.resetLocalDemo();
    });
    expect(didReset).toBe(true);
    expect(createLocalRepository).toHaveBeenCalledTimes(3);
  });

  it('dismisses Undo without restoring the completed item', async () => {
    const repository = new LocalFinancialItemsRepository({
      referenceDate,
      clock: () => new Date('2026-07-18T12:00:00.000Z'),
    });
    const { context } = await renderProvider(repository);

    await act(async () => {
      await context.completeItem('founderscard-trial');
    });
    expect(
      screen.getByRole('button', {
        name: 'Undo completion of Cancel free trial',
      }),
    ).toBeTruthy();
    fireEvent.press(
      screen.getByRole('button', { name: 'Dismiss Undo message' }),
    );

    expect(screen.queryByText('Undo')).toBeNull();
    expect(screen.getByText('At risk 0')).toBeTruthy();
    expect(screen.getByText('Clawed back 59500')).toBeTruthy();
    expect(screen.getByText('Activity 1')).toBeTruthy();
  });

  it('refuses Local reset in Connected mode without deleting or replacing records', async () => {
    const items = createDemoItems(referenceDate);
    const repository: FinancialItemsRepository = {
      listItems: jest.fn().mockResolvedValue(items),
      getItem: jest.fn(),
      createItem: jest.fn(),
      updateItem: jest.fn(),
      completeItem: jest.fn(),
      restoreItem: jest.fn(),
      deleteItem: jest.fn(),
      ensureInitialSeed: jest.fn().mockResolvedValue(undefined),
    };
    const createLocalRepository = jest.fn();
    const createConnectedRuntime = jest.fn().mockResolvedValue({ repository });
    const { context } = await renderProviderWithDependencies({
      environment: {
        mode: 'connected',
        publishableKey: 'public-test-key',
        url: 'https://project.example',
      },
      createLocalRepository,
      createConnectedRuntime,
    });

    await expect(context.resetLocalDemo()).resolves.toBe(false);
    expect(createLocalRepository).not.toHaveBeenCalled();
    expect(repository.deleteItem).not.toHaveBeenCalled();
    expect(repository.listItems).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Items 3')).toBeTruthy();
  });
});
