import { createDemoItems } from '@/constants/demo-data';
import {
  isCanonicalDemoState,
  nextDemoSessionInteractionState,
} from '@/features/financial-items/logic/demo-state';
import type { FinancialItem } from '@/types/financial-item';

const referenceDate = new Date('2026-07-16T22:45:00.000Z');

function connectedSeedItems(): FinancialItem[] {
  return createDemoItems(referenceDate).map((item, index) => ({
    ...item,
    id: `550e8400-e29b-41d4-a716-44665544000${index}`,
    userId: '550e8400-e29b-41d4-a716-446655440099',
    createdAt: `2026-07-16T12:0${index}:00.000Z`,
    updatedAt: `2026-07-16T13:0${index}:00.000Z`,
  }));
}

describe('Checkpoint 6A canonical demo state', () => {
  it('accepts canonical local seeds and uses the factory reference-date logic', () => {
    const items = createDemoItems(referenceDate);

    expect(isCanonicalDemoState(items, referenceDate)).toBe(true);
    expect(
      isCanonicalDemoState(items, new Date('2026-07-17T00:00:00.000Z')),
    ).toBe(false);
  });

  it('accepts Connected UUIDs and ignores generated identity and timestamp metadata', () => {
    expect(isCanonicalDemoState(connectedSeedItems(), referenceDate)).toBe(
      true,
    );
  });

  it('is independent of item ordering', () => {
    expect(
      isCanonicalDemoState(connectedSeedItems().reverse(), referenceDate),
    ).toBe(true);
  });

  it.each([
    ['missing', (items: FinancialItem[]) => items.slice(0, 2)],
    ['duplicate', (items: FinancialItem[]) => [items[0], items[0], items[1]]],
    [
      'extra',
      (items: FinancialItem[]) => [
        ...items,
        { ...items[0], id: 'unexpected-extra' },
      ],
    ],
  ])('fails closed for a %s record set', (_, changeItems) => {
    expect(
      isCanonicalDemoState(
        changeItems(createDemoItems(referenceDate)),
        referenceDate,
      ),
    ).toBe(false);
  });

  it.each<[string, (item: FinancialItem) => FinancialItem]>([
    ['kind', (item) => ({ ...item, kind: 'subscription' })],
    ['title', (item) => ({ ...item, title: 'Changed title' })],
    ['provider', (item) => ({ ...item, provider: 'Changed provider' })],
    ['value', (item) => ({ ...item, valueCents: 1 })],
    ['charge', (item) => ({ ...item, chargeAmountCents: 1 })],
    ['deadline', (item) => ({ ...item, dueAt: '2026-08-01T12:00:00.000Z' })],
    ['recurrence', (item) => ({ ...item, recurrence: 'monthly' })],
    ['action URL', (item) => ({ ...item, actionUrl: null })],
    ['source', (item) => ({ ...item, source: 'manual' })],
    ['confidence', (item) => ({ ...item, extractionConfidence: 0.5 })],
    [
      'completion timestamp',
      (item) => ({ ...item, completedAt: '2026-07-17T12:00:00.000Z' }),
    ],
  ])('fails closed when canonical %s changes', (_, changeItem) => {
    const items = createDemoItems(referenceDate);
    items[0] = changeItem(items[0]);

    expect(isCanonicalDemoState(items, referenceDate)).toBe(false);
  });

  it.each(['completed', 'expired'] as const)(
    'fails closed for a %s seed',
    (status) => {
      const items = createDemoItems(referenceDate);
      items[0] = { ...items[0], status };

      expect(isCanonicalDemoState(items, referenceDate)).toBe(false);
    },
  );

  it('defines a sticky session marker that only explicit reset clears', () => {
    expect(
      nextDemoSessionInteractionState(false, 'meaningful-mutation-succeeded'),
    ).toBe(true);
    expect(
      nextDemoSessionInteractionState(true, 'meaningful-mutation-succeeded'),
    ).toBe(true);
    expect(
      nextDemoSessionInteractionState(true, 'explicit-local-reset-succeeded'),
    ).toBe(false);
  });
});
