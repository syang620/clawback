import { createDemoItems } from '@/constants/demo-data';
import {
  calculateDashboardMetrics,
  findNextDueItem,
} from '@/features/financial-items/logic/dashboard';
import type { FinancialItem } from '@/types/financial-item';

describe('Milestone 01 dashboard logic', () => {
  const items = createDemoItems(new Date('2026-07-16T00:00:00.000Z'));

  it('calculates the three dashboard metrics from item type and status', () => {
    expect(calculateDashboardMetrics(items)).toEqual({
      availableCents: 5_700,
      atRiskCents: 59_500,
      clawedBackCents: 0,
    });

    const completedPerk: FinancialItem = {
      ...items[1],
      status: 'completed',
      completedAt: '2026-07-17T12:00:00.000Z',
    };
    const completedTrial: FinancialItem = {
      ...items[0],
      status: 'completed',
      completedAt: '2026-07-17T12:00:00.000Z',
    };

    expect(calculateDashboardMetrics([completedPerk, completedTrial])).toEqual({
      availableCents: 0,
      atRiskCents: 0,
      clawedBackCents: 60_200,
    });
  });

  it('selects the earliest active item and excludes completed items', () => {
    expect(findNextDueItem(items)?.id).toBe('founderscard-trial');
    expect(
      findNextDueItem([{ ...items[0], status: 'completed' }, ...items.slice(1)])
        ?.id,
    ).toBe('amex-gold-dunkin-credit');
    expect(findNextDueItem([])).toBeNull();
  });

  it('uses the item id as a deterministic deadline tie-breaker', () => {
    const dueAt = '2026-08-01T12:00:00.000Z';
    const first = { ...items[0], id: 'z-item', dueAt };
    const second = { ...items[1], id: 'a-item', dueAt };

    expect(findNextDueItem([first, second])?.id).toBe('a-item');
  });
});
