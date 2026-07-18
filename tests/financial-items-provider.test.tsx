import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { UndoBanner } from '@/components/undo-banner';
import { createDemoItems } from '@/constants/demo-data';
import { completeWithFeedback } from '@/features/financial-items/hooks/use-complete-with-feedback';
import { useFinancialItems } from '@/features/financial-items/hooks/use-financial-items';
import { FinancialItemsProvider } from '@/features/financial-items/hooks/use-financial-items';
import { calculateDashboardMetrics } from '@/features/financial-items/logic/dashboard';

function ProviderHarness({
  requestFeedback,
  results,
}: {
  requestFeedback: () => Promise<boolean>;
  results: boolean[];
}) {
  const { completeItem, items, lastCompletion, undoLastCompletion } =
    useFinancialItems();
  const metrics = calculateDashboardMetrics(items);
  const foundersCard = items.find((item) => item.id === 'founderscard-trial');
  const completedCount = items.filter(
    (item) => item.status === 'completed',
  ).length;

  return (
    <>
      <Text>{`Available ${metrics.availableCents}`}</Text>
      <Text>{`At risk ${metrics.atRiskCents}`}</Text>
      <Text>{`Clawed back ${metrics.clawedBackCents}`}</Text>
      <Text>{`Completion ${lastCompletion?.item.id ?? 'none'}`}</Text>
      <Text>{`Completed count ${completedCount}`}</Text>
      <Text>{`Completed at ${foundersCard?.completedAt ?? 'none'}`}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          results.push(
            completeWithFeedback(
              () =>
                completeItem(
                  'founderscard-trial',
                  new Date('2026-07-17T12:00:00.000Z'),
                ),
              requestFeedback,
            ),
            completeWithFeedback(
              () =>
                completeItem(
                  'founderscard-trial',
                  new Date('2026-07-18T12:00:00.000Z'),
                ),
              requestFeedback,
            ),
          );
        }}
      >
        <Text>Complete FoundersCard twice</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => undoLastCompletion(new Date('2026-07-18T12:00:00.000Z'))}
      >
        <Text>Restore FoundersCard</Text>
      </Pressable>
    </>
  );
}

describe('Milestone 02 shared financial-item state', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shares completion, metric, duplicate-guard, and Undo behavior', () => {
    const results: boolean[] = [];
    const requestFeedback = jest.fn().mockResolvedValue(true);
    const items = createDemoItems(new Date('2026-07-16T00:00:00.000Z'));
    render(
      <FinancialItemsProvider initialItems={items}>
        <ProviderHarness requestFeedback={requestFeedback} results={results} />
        <UndoBanner />
      </FinancialItemsProvider>,
    );

    fireEvent.press(screen.getByText('Complete FoundersCard twice'));

    expect(results).toEqual([true, false]);
    expect(requestFeedback).toHaveBeenCalledTimes(1);
    expect(screen.getByText('At risk 0')).toBeTruthy();
    expect(screen.getByText('Clawed back 59500')).toBeTruthy();
    expect(screen.getByText('Completion founderscard-trial')).toBeTruthy();
    expect(screen.getByText('Completed count 1')).toBeTruthy();
    expect(
      screen.getByText('Completed at 2026-07-17T12:00:00.000Z'),
    ).toBeTruthy();
    expect(
      screen.getByText('Struck. You protected $595 from a potential charge.'),
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Restore FoundersCard'));

    expect(screen.getByText('At risk 59500')).toBeTruthy();
    expect(screen.getByText('Clawed back 0')).toBeTruthy();
    expect(screen.getByText('Completion none')).toBeTruthy();
  });
});
