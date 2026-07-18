export function formatAbsoluteDate(isoDate: string, locale = 'en-US'): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export type CalendarDateInputResult =
  { ok: true; isoDate: string } | { ok: false };

export function parseCalendarDateInput(value: string): CalendarDateInputResult {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { ok: false };

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year === 0 || month < 1 || month > 12 || day < 1 || day > 31) {
    return { ok: false };
  }

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(12, 0, 0, 0);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { ok: false };
  }

  return { ok: true, isoDate: date.toISOString() };
}
