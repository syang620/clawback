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

const CALENDAR_DATE_HOUR_UTC = 12;
const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

interface CalendarDateParts {
  day: number;
  month: number;
  year: number;
}

function parseCalendarDateParts(value: string): CalendarDateParts | null {
  const match = value.trim().match(CALENDAR_DATE_PATTERN);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year === 0 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return { day, month, year };
}

export function parseCalendarDateInput(value: string): CalendarDateInputResult {
  const parts = parseCalendarDateParts(value);
  if (!parts) return { ok: false };
  const { day, month, year } = parts;

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(CALENDAR_DATE_HOUR_UTC, 0, 0, 0);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { ok: false };
  }

  return { ok: true, isoDate: date.toISOString() };
}

export function calendarDateToLocalNoon(value: string): Date | null {
  const parts = parseCalendarDateParts(value);
  if (!parts) return null;
  const { day, month, year } = parts;

  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function localDateToCalendarDate(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (year < 1 || year > 9999) return null;

  const value = `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const reconstructed = calendarDateToLocalNoon(value);
  if (
    !reconstructed ||
    reconstructed.getFullYear() !== year ||
    reconstructed.getMonth() !== month - 1 ||
    reconstructed.getDate() !== day
  ) {
    return null;
  }

  return value;
}

export function localNoonForDate(referenceDate = new Date()): Date {
  if (Number.isNaN(referenceDate.getTime())) {
    throw new RangeError('Reference date must be valid.');
  }

  const value = localDateToCalendarDate(referenceDate);
  const localNoon = value ? calendarDateToLocalNoon(value) : null;
  if (!localNoon) throw new RangeError('Reference date is outside range.');
  return localNoon;
}

export function formatCalendarDateDisplay(
  value: string,
  locale = 'en-US',
): string | null {
  const date = calendarDateToLocalNoon(value);
  if (!date) return null;

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatCalendarDateInput(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Calendar date timestamp must be valid.');
  }

  const year = date.getUTCFullYear().toString().padStart(4, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
