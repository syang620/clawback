import { createDemoItems } from '@/constants/demo-data';
import {
  calculateDashboardMetrics,
  findEarliestActiveDeadline,
  getActiveDeadlineCalendarDate,
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

  function highlightedIds(candidateItems: FinancialItem[]): string[] {
    const earliest = findEarliestActiveDeadline(candidateItems);
    return candidateItems
      .filter(
        (item) =>
          earliest !== null && getActiveDeadlineCalendarDate(item) === earliest,
      )
      .map((item) => item.id)
      .sort();
  }

  it('identifies one unique earliest active calendar deadline', () => {
    expect(findEarliestActiveDeadline(items)).toBe('2026-07-19');
    expect(highlightedIds(items)).toEqual(['founderscard-trial']);
  });

  it.each([2, 3])('identifies all %i tasks tied for earliest', (tieCount) => {
    const dueTimes = [
      '2026-08-01T08:00:00.000Z',
      '2026-08-01T23:00:00.000-08:00',
      '2026-08-01T01:00:00.000+10:00',
    ];
    const tied = items.slice(0, tieCount).map((item, index) => ({
      ...item,
      dueAt: dueTimes[index],
      id: `tie-${index + 1}`,
    }));
    const later = {
      ...items[0],
      dueAt: '2026-08-02T12:00:00.000Z',
      id: 'later',
    };

    expect(highlightedIds([...tied, later])).toEqual(
      tied.map((item) => item.id).sort(),
    );
  });

  it('is independent of tied input order and arbitrary ids', () => {
    const dueAt = '2026-08-01T12:00:00.000Z';
    const tied = [
      { ...items[0], id: 'z-item', dueAt },
      { ...items[1], id: 'a-item', dueAt },
    ];

    expect(highlightedIds(tied)).toEqual(['a-item', 'z-item']);
    expect(highlightedIds(tied.slice().reverse())).toEqual([
      'a-item',
      'z-item',
    ]);
  });

  it('ignores completed and expired tasks on an earlier date', () => {
    const inactive = [
      {
        ...items[0],
        dueAt: '2026-07-01T12:00:00.000Z',
        status: 'completed' as const,
      },
      {
        ...items[1],
        dueAt: '2026-07-01T12:00:00.000Z',
        status: 'expired' as const,
      },
    ];
    const active = { ...items[2], dueAt: '2026-08-01T12:00:00.000Z' };

    expect(findEarliestActiveDeadline([...inactive, active])).toBe(
      '2026-08-01',
    );
    expect(highlightedIds([...inactive, active])).toEqual([active.id]);
  });

  it('fails safely for malformed deadlines', () => {
    const malformed = { ...items[0], dueAt: 'not-a-date' };
    const impossible = { ...items[2], dueAt: '2026-02-30T12:00:00.000Z' };
    const valid = { ...items[1], dueAt: '2026-08-01T12:00:00.000Z' };

    expect(findEarliestActiveDeadline([malformed, impossible, valid])).toBe(
      '2026-08-01',
    );
    expect(highlightedIds([malformed, impossible, valid])).toEqual([valid.id]);
    expect(findEarliestActiveDeadline([malformed, impossible])).toBeNull();
  });

  it('returns no earliest deadline when there are no active tasks', () => {
    const inactive = items.map((item) => ({
      ...item,
      status: 'completed' as const,
    }));

    expect(findEarliestActiveDeadline(inactive)).toBeNull();
    expect(highlightedIds(inactive)).toEqual([]);
    expect(findEarliestActiveDeadline([])).toBeNull();
  });
});
