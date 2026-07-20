import {
  calendarDateToLocalNoon,
  localDateToCalendarDate,
  localNoonForDate,
} from '@/lib/dates';

describe('Deadline calendar-date conversions', () => {
  it.each(['2024-02-29', '2026-01-31', '2026-12-31', '2027-01-01'])(
    'round-trips leap and month/year boundary date %s',
    (value) => {
      const date = calendarDateToLocalNoon(value);

      expect(date).not.toBeNull();
      expect(date?.getHours()).toBe(12);
      expect(localDateToCalendarDate(date as Date)).toBe(value);
    },
  );

  it.each(['', 'not-a-date', '2026-02-29', '2026-04-31', '0000-01-01'])(
    'fails closed for invalid calendar string %s',
    (value) => {
      expect(calendarDateToLocalNoon(value)).toBeNull();
    },
  );

  it('uses local components without shifting the selected day', () => {
    const originalTimeZone = process.env.TZ;

    try {
      for (const timeZone of [
        'Pacific/Kiritimati',
        'America/Los_Angeles',
        'Pacific/Honolulu',
      ]) {
        process.env.TZ = timeZone;
        const selected = new Date(2026, 0, 1, 23, 45, 0, 0);
        expect(localDateToCalendarDate(selected)).toBe('2026-01-01');
        expect(calendarDateToLocalNoon('2026-01-01')?.getHours()).toBe(12);
      }
    } finally {
      process.env.TZ = originalTimeZone;
    }
  });

  it('normalizes a fallback reference date to local noon', () => {
    const fallback = localNoonForDate(new Date(2026, 6, 19, 23, 59));

    expect(localDateToCalendarDate(fallback)).toBe('2026-07-19');
    expect(fallback.getHours()).toBe(12);
    expect(fallback.getMinutes()).toBe(0);
  });
});
