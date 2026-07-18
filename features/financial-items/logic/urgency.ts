import type { FinancialItem, FinancialItemKind } from '@/types/financial-item';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export type UrgencyBand =
  'deadline-passed' | 'critical' | 'soon' | 'upcoming' | 'later';

export interface DeadlinePresentation {
  daysUntilDeadline: number | null;
  relativeDeadlineLabel: string;
  urgencyBand: UrgencyBand | null;
  urgencyLabel: string;
}

const urgencyOrder: Record<UrgencyBand, number> = {
  'deadline-passed': 0,
  critical: 1,
  soon: 2,
  upcoming: 3,
  later: 4,
};

const kindOrder: Record<FinancialItemKind, number> = {
  trial: 0,
  subscription: 0,
  perk: 1,
};

function utcCalendarTimestamp(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function relevantAmountCents(item: FinancialItem): number {
  return item.kind === 'perk'
    ? (item.valueCents ?? 0)
    : (item.chargeAmountCents ?? 0);
}

export function getDeadlinePresentation(
  dueAt: string,
  referenceDate: Date,
): DeadlinePresentation {
  const dueDate = new Date(dueAt);

  if (
    Number.isNaN(dueDate.getTime()) ||
    Number.isNaN(referenceDate.getTime())
  ) {
    return {
      daysUntilDeadline: null,
      relativeDeadlineLabel: 'Date unavailable',
      urgencyBand: null,
      urgencyLabel: 'Date unavailable',
    };
  }

  const daysUntilDeadline = Math.round(
    (utcCalendarTimestamp(dueDate) - utcCalendarTimestamp(referenceDate)) /
      MILLISECONDS_PER_DAY,
  );

  if (daysUntilDeadline < 0) {
    return {
      daysUntilDeadline,
      relativeDeadlineLabel: 'Deadline passed',
      urgencyBand: 'deadline-passed',
      urgencyLabel: 'Deadline passed',
    };
  }

  const relativeDeadlineLabel =
    daysUntilDeadline === 0
      ? 'Due today'
      : daysUntilDeadline === 1
        ? 'Due tomorrow'
        : `Due in ${daysUntilDeadline} days`;

  if (daysUntilDeadline <= 2) {
    return {
      daysUntilDeadline,
      relativeDeadlineLabel,
      urgencyBand: 'critical',
      urgencyLabel: 'Critical',
    };
  }

  if (daysUntilDeadline <= 7) {
    return {
      daysUntilDeadline,
      relativeDeadlineLabel,
      urgencyBand: 'soon',
      urgencyLabel: 'Soon',
    };
  }

  if (daysUntilDeadline <= 14) {
    return {
      daysUntilDeadline,
      relativeDeadlineLabel,
      urgencyBand: 'upcoming',
      urgencyLabel: 'Upcoming',
    };
  }

  return {
    daysUntilDeadline,
    relativeDeadlineLabel,
    urgencyBand: 'later',
    urgencyLabel: 'Later',
  };
}

export function rankFinancialItems(
  items: FinancialItem[],
  referenceDate: Date,
): FinancialItem[] {
  return items
    .filter((item) => item.status === 'active')
    .slice()
    .sort((left, right) => {
      const leftPresentation = getDeadlinePresentation(
        left.dueAt,
        referenceDate,
      );
      const rightPresentation = getDeadlinePresentation(
        right.dueAt,
        referenceDate,
      );
      const leftUrgency = leftPresentation.urgencyBand
        ? urgencyOrder[leftPresentation.urgencyBand]
        : Number.POSITIVE_INFINITY;
      const rightUrgency = rightPresentation.urgencyBand
        ? urgencyOrder[rightPresentation.urgencyBand]
        : Number.POSITIVE_INFINITY;

      if (leftUrgency !== rightUrgency) return leftUrgency - rightUrgency;

      const leftDeadline = Date.parse(left.dueAt);
      const rightDeadline = Date.parse(right.dueAt);
      const safeLeftDeadline = Number.isFinite(leftDeadline)
        ? leftDeadline
        : Number.POSITIVE_INFINITY;
      const safeRightDeadline = Number.isFinite(rightDeadline)
        ? rightDeadline
        : Number.POSITIVE_INFINITY;

      if (safeLeftDeadline !== safeRightDeadline) {
        return safeLeftDeadline - safeRightDeadline;
      }

      const amountDifference =
        relevantAmountCents(right) - relevantAmountCents(left);
      if (amountDifference !== 0) return amountDifference;

      const kindDifference = kindOrder[left.kind] - kindOrder[right.kind];
      if (kindDifference !== 0) return kindDifference;

      return left.id.localeCompare(right.id);
    });
}
