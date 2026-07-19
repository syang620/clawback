import { act, render, screen, waitFor } from '@testing-library/react-native';
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
      <Text>{`Items ${context.items.length}`}</Text>
      <Text>{`Available ${metrics.availableCents}`}</Text>
      <Text>{`At risk ${metrics.atRiskCents}`}</Text>
      <Text>{`Clawed back ${metrics.clawedBackCents}`}</Text>
      <Text>{`First ${ranked[0]?.title ?? 'none'}`}</Text>
      <Text>{`Errors ${context.mutationErrors.length}`}</Text>
      <Text>{`Error message ${context.mutationErrors[0]?.message ?? 'none'}`}</Text>
      <Text>{`Pending ${Object.keys(context.pendingItemOperations).length}`}</Text>
    </>
  );
}

async function renderProvider(repository: FinancialItemsRepository) {
  let context = undefined as unknown as ReturnType<typeof useFinancialItems>;
  const view = render(
    <FinancialItemsProvider
      dependencies={dependenciesFor(repository)}
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

    await act(async () => {
      await context.undoLastCompletion();
    });
    expect(screen.getByText('At risk 59500')).toBeTruthy();
    expect(screen.getByText('Clawed back 0')).toBeTruthy();
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
});
