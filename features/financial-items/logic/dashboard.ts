import { parseCalendarDateInput } from '@/lib/dates';
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

export function getActiveDeadlineCalendarDate(
  item: FinancialItem,
): string | null {
  if (item.status !== 'active') return null;

  const calendarDate = item.dueAt.match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/)?.[1];
  if (!calendarDate || !parseCalendarDateInput(calendarDate).ok) return null;
  if (!Number.isFinite(Date.parse(item.dueAt))) return null;
  return calendarDate;
}

export function findEarliestActiveDeadline(
  items: FinancialItem[],
): string | null {
  return items.reduce<string | null>((earliestDate, item) => {
    const calendarDate = getActiveDeadlineCalendarDate(item);
    if (!calendarDate) return earliestDate;
    if (!earliestDate || calendarDate < earliestDate) return calendarDate;
    return earliestDate;
  }, null);
}
