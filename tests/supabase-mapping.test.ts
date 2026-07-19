import { Platform } from 'react-native';

import { formatCalendarDateInput, parseCalendarDateInput } from '@/lib/dates';
import {
  calendarDateFromFinancialItemRow,
  mapFinancialItemRow,
  toFinancialItemInsert,
  toFinancialItemUpdate,
} from '@/services/financial-items/mapping';
import type { FinancialItemRow } from '@/services/financial-items/mapping';
import type { CreateFinancialItemInput } from '@/types/financial-item';

const row: FinancialItemRow = {
  id: '34b30473-9696-4c8a-8550-f220229faef6',
  user_id: '13f4d2e7-d24c-4cfb-9ce1-77ddaf75ea5f',
  kind: 'perk',
  title: 'Use travel credit',
  provider: 'Example Card',
  value_cents: 5000,
  charge_amount_cents: null,
  due_at: '2026-07-31T12:00:00+00:00',
  recurrence: 'quarterly',
  action_url: 'https://example.com/account',
  status: 'active',
  source: 'manual',
  extraction_confidence: null,
  created_at: '2026-07-18T15:00:00+00:00',
  updated_at: '2026-07-18T15:00:00+00:00',
  completed_at: null,
};

describe('Checkpoint 4A database mapping', () => {
  it('maps a valid database row into the existing domain model', () => {
    expect(mapFinancialItemRow(row)).toEqual({
      id: row.id,
      userId: row.user_id,
      kind: 'perk',
      title: 'Use travel credit',
      provider: 'Example Card',
      valueCents: 5000,
      chargeAmountCents: null,
      dueAt: '2026-07-31T12:00:00.000Z',
      recurrence: 'quarterly',
      actionUrl: 'https://example.com/account',
      status: 'active',
      source: 'manual',
      extractionConfidence: null,
      createdAt: '2026-07-18T15:00:00.000Z',
      updatedAt: '2026-07-18T15:00:00.000Z',
      completedAt: null,
    });
  });

  it.each(['web', 'ios'] as const)(
    'round-trips a date-only deadline without shifting on %s',
    (platform) => {
      const originalPlatform = Platform.OS;
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: platform,
      });
      try {
        const parsed = parseCalendarDateInput('2026-07-31');
        if (!parsed.ok) throw new Error('Expected a valid calendar date.');
        const storedRow = { ...row, due_at: parsed.isoDate };

        expect(calendarDateFromFinancialItemRow(storedRow)).toBe('2026-07-31');
        expect(
          formatCalendarDateInput(mapFinancialItemRow(storedRow).dueAt),
        ).toBe('2026-07-31');
      } finally {
        Object.defineProperty(Platform, 'OS', {
          configurable: true,
          value: originalPlatform,
        });
      }
    },
  );

  it('rejects malformed network rows at runtime', () => {
    expect(() => mapFinancialItemRow({ ...row, value_cents: -1 })).toThrow(
      'Invalid financial item value.',
    );
    expect(() =>
      mapFinancialItemRow({ ...row, action_url: 'http://bad.test' }),
    ).toThrow('Invalid financial item action URL.');
    expect(() => mapFinancialItemRow({ ...row, source: 'unknown' })).toThrow(
      'Invalid item source.',
    );
  });

  it('maps a create input without client timestamps or ownership overrides', () => {
    const input: CreateFinancialItemInput = {
      kind: 'trial',
      title: 'Review renewal',
      provider: null,
      valueCents: null,
      chargeAmountCents: 14900,
      dueAt: '2026-08-15T12:00:00.000Z',
      recurrence: 'annual',
      actionUrl: null,
      source: 'manual',
      extractionConfidence: null,
    };

    expect(toFinancialItemInsert(input, row.user_id)).toEqual({
      user_id: row.user_id,
      kind: 'trial',
      title: 'Review renewal',
      provider: null,
      value_cents: null,
      charge_amount_cents: 14900,
      due_at: '2026-08-15T12:00:00.000Z',
      recurrence: 'annual',
      action_url: null,
      status: 'active',
      source: 'manual',
      extraction_confidence: null,
      completed_at: null,
    });
  });

  it('preserves validated email provenance on creation', () => {
    expect(
      toFinancialItemInsert(
        {
          kind: 'subscription',
          title: 'Review email renewal',
          provider: 'Example',
          valueCents: null,
          chargeAmountCents: 1299,
          dueAt: '2026-08-15T12:00:00.000Z',
          recurrence: 'monthly',
          actionUrl: null,
          source: 'email',
          extractionConfidence: 0.65,
        },
        row.user_id,
      ),
    ).toMatchObject({ source: 'email', extraction_confidence: 0.65 });
  });

  it('rejects invalid public creation provenance at runtime', () => {
    const base = {
      kind: 'trial',
      title: 'Invalid provenance',
      provider: null,
      valueCents: null,
      chargeAmountCents: 1000,
      dueAt: '2026-08-15T12:00:00.000Z',
      recurrence: 'none',
      actionUrl: null,
    };

    expect(() =>
      toFinancialItemInsert(
        {
          ...base,
          source: 'demo',
          extractionConfidence: null,
        } as unknown as CreateFinancialItemInput,
        row.user_id,
      ),
    ).toThrow('Invalid financial item creation provenance.');
    expect(() =>
      toFinancialItemInsert(
        {
          ...base,
          source: 'email',
          extractionConfidence: null,
        } as unknown as CreateFinancialItemInput,
        row.user_id,
      ),
    ).toThrow('Invalid financial item creation provenance.');
  });

  it('does not map provenance fields into updates', () => {
    expect(
      toFinancialItemUpdate({
        title: 'Safe update',
        source: 'demo',
        extractionConfidence: 1,
      } as never),
    ).toEqual({ title: 'Safe update' });
  });

  it('rejects inconsistent provenance returned by a repository', () => {
    expect(() =>
      mapFinancialItemRow({
        ...row,
        source: 'email',
        extraction_confidence: null,
      }),
    ).toThrow('Invalid financial item provenance.');
    expect(() =>
      mapFinancialItemRow({
        ...row,
        source: 'manual',
        extraction_confidence: 0.5,
      }),
    ).toThrow('Invalid financial item provenance.');
  });
});
