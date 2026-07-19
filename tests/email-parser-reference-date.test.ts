import {
  deriveReferenceDate,
  resolveDeviceTimeZone,
} from '@/features/email-parser/reference-date';

describe('email extraction reference dates', () => {
  it.each([
    ['2026-01-01T01:00:00.000Z', 'America/Los_Angeles', '2025-12-31'],
    ['2025-12-31T11:30:00.000Z', 'Pacific/Kiritimati', '2026-01-01'],
    ['2024-02-29T12:00:00.000Z', 'UTC', '2024-02-29'],
    ['2026-03-08T06:59:00.000Z', 'America/New_York', '2026-03-08'],
    ['2026-11-01T06:01:00.000Z', 'America/New_York', '2026-11-01'],
  ])(
    'derives %s in %s as the Gregorian Latin-digit date %s',
    (instant, timeZone, expected) => {
      expect(deriveReferenceDate(new Date(instant), timeZone)).toBe(expected);
    },
  );

  it('rejects an unresolved or invalid IANA timezone', () => {
    expect(() => deriveReferenceDate(new Date(), '')).toThrow(
      'A valid device timezone is required for email extraction.',
    );
    expect(() => deriveReferenceDate(new Date(), 'Not/A_Zone')).toThrow(
      'A valid device timezone is required for email extraction.',
    );
  });

  it('returns a resolved IANA timezone without using the device locale', () => {
    expect(resolveDeviceTimeZone()).toEqual(expect.any(String));
    expect(resolveDeviceTimeZone().length).toBeGreaterThan(0);
  });
});
