import type { FinancialItem } from '@/types/financial-item';

function toTimestamp(value: Date): string {
  if (Number.isNaN(value.getTime())) {
    throw new RangeError('Transition date must be valid.');
  }

  return value.toISOString();
}

export function completeFinancialItem(
  item: FinancialItem,
  completedAt: Date,
): FinancialItem {
  if (item.status !== 'active') return item;

  const timestamp = toTimestamp(completedAt);
  return {
    ...item,
    status: 'completed',
    completedAt: timestamp,
    updatedAt: timestamp,
  };
}

export function restoreFinancialItem(
  item: FinancialItem,
  restoredAt: Date,
): FinancialItem {
  if (item.status !== 'completed') return item;

  return {
    ...item,
    status: 'active',
    completedAt: null,
    updatedAt: toTimestamp(restoredAt),
  };
}
