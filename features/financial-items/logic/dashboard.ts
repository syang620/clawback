import type { FinancialItem } from '@/types/financial-item';

export interface DashboardMetrics {
  availableCents: number;
  atRiskCents: number;
  clawedBackCents: number;
}

export function calculateDashboardMetrics(
  items: FinancialItem[],
): DashboardMetrics {
  return items.reduce<DashboardMetrics>(
    (metrics, item) => {
      if (item.status === 'active') {
        if (item.kind === 'perk') {
          metrics.availableCents += item.valueCents ?? 0;
        } else {
          metrics.atRiskCents += item.chargeAmountCents ?? 0;
        }
      }

      if (item.status === 'completed') {
        metrics.clawedBackCents +=
          item.kind === 'perk'
            ? (item.valueCents ?? 0)
            : (item.chargeAmountCents ?? 0);
      }

      return metrics;
    },
    { availableCents: 0, atRiskCents: 0, clawedBackCents: 0 },
  );
}

export function findNextDueItem(items: FinancialItem[]): FinancialItem | null {
  return items
    .filter(
      (item) =>
        item.status === 'active' && Number.isFinite(Date.parse(item.dueAt)),
    )
    .reduce<FinancialItem | null>((nextItem, item) => {
      if (!nextItem) return item;

      const dueDifference = Date.parse(item.dueAt) - Date.parse(nextItem.dueAt);
      if (dueDifference < 0) return item;
      if (dueDifference === 0 && item.id < nextItem.id) return item;
      return nextItem;
    }, null);
}
