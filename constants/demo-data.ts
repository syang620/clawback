import type { FinancialItem } from '@/types/financial-item';

const DEMO_HOUR_UTC = 12;

function atUtcCalendarDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, DEMO_HOUR_UTC));
}

function normalizeReferenceDate(referenceDate: Date): Date {
  if (Number.isNaN(referenceDate.getTime())) {
    throw new RangeError('Reference date must be valid.');
  }

  return atUtcCalendarDate(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
  );
}

function addUtcDays(date: Date, days: number): Date {
  return atUtcCalendarDate(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + days,
  );
}

function firstMonthEndAfter(date: Date): Date {
  let monthEnd = atUtcCalendarDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    0,
  );

  if (monthEnd.getTime() <= date.getTime()) {
    monthEnd = atUtcCalendarDate(
      date.getUTCFullYear(),
      date.getUTCMonth() + 2,
      0,
    );
  }

  return monthEnd;
}

function firstQuarterEndAfter(date: Date): Date {
  const quarterEndMonth = Math.floor(date.getUTCMonth() / 3) * 3 + 2;
  let quarterEnd = atUtcCalendarDate(
    date.getUTCFullYear(),
    quarterEndMonth + 1,
    0,
  );

  if (quarterEnd.getTime() <= date.getTime()) {
    quarterEnd = atUtcCalendarDate(
      date.getUTCFullYear(),
      quarterEndMonth + 4,
      0,
    );
  }

  return quarterEnd;
}

export function createDemoItems(referenceDate: Date): FinancialItem[] {
  const createdAt = normalizeReferenceDate(referenceDate);
  const foundersCardDueAt = addUtcDays(createdAt, 3);
  const amexDueAt = firstMonthEndAfter(foundersCardDueAt);
  const hiltonDueAt = firstQuarterEndAfter(foundersCardDueAt);
  const timestamp = createdAt.toISOString();

  return [
    {
      id: 'founderscard-trial',
      userId: null,
      kind: 'trial',
      title: 'Cancel free trial',
      provider: 'FoundersCard',
      valueCents: null,
      chargeAmountCents: 59_500,
      dueAt: foundersCardDueAt.toISOString(),
      recurrence: 'annual',
      actionUrl: 'https://founderscard.com/',
      status: 'active',
      source: 'demo',
      extractionConfidence: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
    },
    {
      id: 'amex-gold-dunkin-credit',
      userId: null,
      kind: 'perk',
      title: "Use monthly Dunkin' credit",
      provider: 'Amex Gold',
      valueCents: 700,
      chargeAmountCents: null,
      dueAt: amexDueAt.toISOString(),
      recurrence: 'monthly',
      actionUrl: null,
      status: 'active',
      source: 'demo',
      extractionConfidence: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
    },
    {
      id: 'hilton-aspire-airline-benefit',
      userId: null,
      kind: 'perk',
      title: 'Use quarterly airline benefit',
      provider: 'Hilton Aspire',
      valueCents: 5_000,
      chargeAmountCents: null,
      dueAt: hiltonDueAt.toISOString(),
      recurrence: 'quarterly',
      actionUrl: null,
      status: 'active',
      source: 'demo',
      extractionConfidence: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
    },
  ];
}
