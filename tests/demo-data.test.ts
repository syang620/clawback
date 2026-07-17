import { createDemoItems } from '@/constants/demo-data';

describe('createDemoItems', () => {
  it.each([
    ['month end', '2026-01-28T12:00:00.000Z'],
    ['quarter end', '2026-03-28T12:00:00.000Z'],
    ['year end', '2026-12-29T12:00:00.000Z'],
    ['leap year', '2028-02-26T12:00:00.000Z'],
  ])('keeps FoundersCard earliest near %s', (_, referenceDate) => {
    const items = createDemoItems(new Date(referenceDate));
    const [foundersCard, amex, hilton] = items;

    expect(Date.parse(foundersCard.dueAt)).toBeLessThan(Date.parse(amex.dueAt));
    expect(Date.parse(foundersCard.dueAt)).toBeLessThan(
      Date.parse(hilton.dueAt),
    );
  });

  it('uses fixed UTC calendar values from an explicit reference date', () => {
    const items = createDemoItems(new Date('2026-07-16T22:45:00.000Z'));

    expect(items.map((item) => item.dueAt)).toEqual([
      '2026-07-19T12:00:00.000Z',
      '2026-07-31T12:00:00.000Z',
      '2026-09-30T12:00:00.000Z',
    ]);
  });

  it('rejects an invalid reference date', () => {
    expect(() => createDemoItems(new Date('invalid'))).toThrow(RangeError);
  });
});
