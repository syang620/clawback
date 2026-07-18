import { createDemoItems } from '@/constants/demo-data';
import {
  getDeadlinePresentation,
  rankFinancialItems,
} from '@/features/financial-items/logic/urgency';
import type { FinancialItem } from '@/types/financial-item';

describe('Milestone 02 urgency logic', () => {
  const referenceDate = new Date('2026-07-16T22:45:00.000Z');

  it.each([
    ['2026-07-15T23:59:00.000Z', 'deadline-passed', 'Deadline passed'],
    ['2026-07-16T00:01:00.000Z', 'critical', 'Due today'],
    ['2026-07-17T23:59:00.000Z', 'critical', 'Due tomorrow'],
    ['2026-07-18T12:00:00.000Z', 'critical', 'Due in 2 days'],
    ['2026-07-19T12:00:00.000Z', 'soon', 'Due in 3 days'],
    ['2026-07-23T12:00:00.000Z', 'soon', 'Due in 7 days'],
    ['2026-07-24T12:00:00.000Z', 'upcoming', 'Due in 8 days'],
    ['2026-07-30T12:00:00.000Z', 'upcoming', 'Due in 14 days'],
    ['2026-07-31T12:00:00.000Z', 'later', 'Due in 15 days'],
  ])(
    'separates the urgency band and relative label for %s',
    (dueAt, urgencyBand, relativeDeadlineLabel) => {
      expect(getDeadlinePresentation(dueAt, referenceDate)).toMatchObject({
        urgencyBand,
        relativeDeadlineLabel,
      });
    },
  );

  it('handles invalid dates without crashing', () => {
    expect(getDeadlinePresentation('invalid', referenceDate)).toEqual({
      daysUntilDeadline: null,
      relativeDeadlineLabel: 'Date unavailable',
      urgencyBand: null,
      urgencyLabel: 'Date unavailable',
    });
  });

  it('ranks by band, exact deadline, amount, risk-bearing kind, then id', () => {
    const [baseTrial, basePerk] = createDemoItems(referenceDate);
    const dueSooner = '2026-07-19T10:00:00.000Z';
    const dueLater = '2026-07-19T11:00:00.000Z';
    const makeItem = (
      overrides: Partial<FinancialItem> & Pick<FinancialItem, 'id'>,
    ): FinancialItem => ({ ...basePerk, ...overrides });
    const items: FinancialItem[] = [
      makeItem({
        id: 'invalid-date',
        dueAt: 'invalid',
        valueCents: 99_999,
      }),
      makeItem({ id: 'later-deadline', dueAt: dueLater, valueCents: 99_999 }),
      makeItem({ id: 'smaller-amount', dueAt: dueSooner, valueCents: 500 }),
      makeItem({ id: 'perk-z', dueAt: dueSooner, valueCents: 1_000 }),
      makeItem({
        id: 'risk-z',
        kind: 'subscription',
        dueAt: dueSooner,
        valueCents: null,
        chargeAmountCents: 1_000,
      }),
      {
        ...baseTrial,
        id: 'risk-a',
        dueAt: dueSooner,
        chargeAmountCents: 1_000,
      },
      makeItem({
        id: 'passed',
        dueAt: '2026-07-15T12:00:00.000Z',
        valueCents: 1,
      }),
      makeItem({ id: 'completed', dueAt: dueSooner, status: 'completed' }),
    ];

    expect(
      rankFinancialItems(items.reverse(), referenceDate).map(({ id }) => id),
    ).toEqual([
      'passed',
      'risk-a',
      'risk-z',
      'perk-z',
      'smaller-amount',
      'later-deadline',
      'invalid-date',
    ]);
  });
});
