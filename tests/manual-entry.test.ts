import {
  createEmptyManualFinancialItemForm,
  createManualFinancialItem,
  validateManualFinancialItem,
} from '@/features/financial-items/logic/manual-entry';
import { parseCalendarDateInput } from '@/lib/dates';
import { parseDollarInput } from '@/lib/money';

describe('Milestone 03 money input', () => {
  it.each([
    ['', null],
    ['   ', null],
    ['0', 0],
    ['$0.00', 0],
    ['12', 1_200],
    ['12.3', 1_230],
    ['12.34', 1_234],
    ['.50', 50],
    ['$1,234.56', 123_456],
  ])('parses %j without floating-point dollar arithmetic', (value, cents) => {
    expect(parseDollarInput(value)).toEqual({ ok: true, valueCents: cents });
  });

  it.each(['-', '-1', '+1', '1e3', '12.345', '1,23', '$', 'twelve'])(
    'rejects invalid money input %j',
    (value) => {
      expect(parseDollarInput(value)).toEqual({
        ok: false,
        reason: 'invalid',
      });
    },
  );

  it('rejects amounts that cannot be represented as safe integer cents', () => {
    expect(parseDollarInput('90071992547409.92')).toEqual({
      ok: false,
      reason: 'too-large',
    });
  });
});

describe('Milestone 03 calendar-date input', () => {
  it('stores a valid date at noon UTC without a visible time requirement', () => {
    expect(parseCalendarDateInput('2028-02-29')).toEqual({
      ok: true,
      isoDate: '2028-02-29T12:00:00.000Z',
    });
  });

  it.each(['', '2026/07/31', '2026-2-03', '2026-02-30', '0000-01-01'])(
    'rejects malformed or nonexistent calendar date %j',
    (value) => {
      expect(parseCalendarDateInput(value)).toEqual({ ok: false });
    },
  );
});

describe('Milestone 03 manual-item validation and creation', () => {
  it('returns field errors without substituting invalid input values', () => {
    const values = {
      ...createEmptyManualFinancialItemForm(),
      title: 'Keep this title',
      deadline: '2026-02-30',
      valueAvailable: 'bad money',
      actionUrl: 'http://example.com',
    };

    const result = validateManualFinancialItem(values);
    expect(result).toEqual({
      ok: false,
      errors: {
        kind: 'Choose a task type.',
        deadline: 'Enter a real calendar date in YYYY-MM-DD format.',
        valueAvailable:
          'Enter a non-negative dollar amount with no more than two decimal places.',
        actionUrl: 'Enter a full HTTPS URL without a username or password.',
      },
    });
    expect(values.title).toBe('Keep this title');
    expect(values.valueAvailable).toBe('bad money');
  });

  it('normalizes a valid form while keeping blank and zero money distinct', () => {
    const result = validateManualFinancialItem({
      ...createEmptyManualFinancialItemForm('perk'),
      title: '  Use travel credit  ',
      provider: '  Example Card  ',
      deadline: '2026-07-31',
      valueAvailable: '0',
      chargeAtRisk: '',
      recurrence: 'quarterly',
      actionUrl: 'https://example.com/account',
    });

    expect(result).toEqual({
      ok: true,
      input: {
        kind: 'perk',
        title: 'Use travel credit',
        provider: 'Example Card',
        valueCents: 0,
        chargeAmountCents: null,
        dueAt: '2026-07-31T12:00:00.000Z',
        recurrence: 'quarterly',
        actionUrl: 'https://example.com/account',
        source: 'manual',
        extractionConfidence: null,
      },
    });
  });

  it('creates an active manual item without claiming a financial action', () => {
    const validation = validateManualFinancialItem({
      ...createEmptyManualFinancialItemForm('subscription'),
      title: 'Review renewal',
      deadline: '2026-08-15',
      chargeAtRisk: '149',
    });
    if (!validation.ok) throw new Error('Expected valid fixture.');

    const item = createManualFinancialItem(
      validation.input,
      'manual-test-1',
      new Date('2026-07-18T12:00:00.000Z'),
    );

    expect(item).toMatchObject({
      id: 'manual-test-1',
      status: 'active',
      source: 'manual',
      userId: null,
      extractionConfidence: null,
      completedAt: null,
      createdAt: '2026-07-18T12:00:00.000Z',
      updatedAt: '2026-07-18T12:00:00.000Z',
    });
  });
});
