import { formatAbsoluteDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';

describe('Milestone 01 formatters', () => {
  it('formats integer cents while keeping null and zero distinct', () => {
    expect(formatMoney(59_500)).toBe('$595');
    expect(formatMoney(725)).toBe('$7.25');
    expect(formatMoney(0)).toBe('$0');
    expect(formatMoney(null)).toBe('Not specified');
  });

  it('formats an absolute UTC calendar date without a time', () => {
    expect(formatAbsoluteDate('2026-07-19T23:30:00.000Z')).toBe('Jul 19, 2026');
    expect(formatAbsoluteDate('not-a-date')).toBe('Date unavailable');
  });
});
