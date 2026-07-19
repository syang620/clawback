import type { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseFinancialItemsRepository } from '@/services/financial-items/supabase-financial-items-repository';
import { FinancialItemsRepositoryError } from '@/services/financial-items/repository';
import type { Database } from '@/types/database';
import type { CreateFinancialItemInput } from '@/types/financial-item';

const userId = '13f4d2e7-d24c-4cfb-9ce1-77ddaf75ea5f';
const row = {
  id: '34b30473-9696-4c8a-8550-f220229faef6',
  user_id: userId,
  kind: 'perk',
  title: 'Use travel credit',
  provider: null,
  value_cents: 5000,
  charge_amount_cents: null,
  due_at: '2026-07-31T12:00:00.000Z',
  recurrence: 'quarterly',
  action_url: null,
  status: 'active',
  source: 'manual',
  extraction_confidence: null,
  created_at: '2026-07-18T12:00:00.000Z',
  updated_at: '2026-07-18T12:00:00.000Z',
  completed_at: null,
};
const input: CreateFinancialItemInput = {
  kind: 'perk',
  title: 'Use travel credit',
  provider: null,
  valueCents: 5000,
  chargeAmountCents: null,
  dueAt: '2026-07-31T12:00:00.000Z',
  recurrence: 'quarterly',
  actionUrl: null,
  source: 'manual',
  extractionConfidence: null,
};

function asClient(value: object): SupabaseClient<Database> {
  return value as unknown as SupabaseClient<Database>;
}

describe('Checkpoint 4A Supabase repository', () => {
  it('creates an owned manual item and maps the returned row', async () => {
    const single = jest.fn().mockResolvedValue({ data: row, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    const repository = new SupabaseFinancialItemsRepository(
      asClient({ from }),
      userId,
    );

    await expect(repository.createItem(input)).resolves.toMatchObject({
      userId,
      source: 'manual',
      status: 'active',
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: userId, source: 'manual' }),
    );
  });

  it('creates an owned email item without overwriting provenance', async () => {
    const emailRow = {
      ...row,
      source: 'email',
      extraction_confidence: 0.85,
    };
    const insert = jest.fn(() => ({
      select: () => ({
        single: jest.fn().mockResolvedValue({ data: emailRow, error: null }),
      }),
    }));
    const repository = new SupabaseFinancialItemsRepository(
      asClient({ from: () => ({ insert }) }),
      userId,
    );

    await expect(
      repository.createItem({
        ...input,
        source: 'email',
        extractionConfidence: 0.85,
      }),
    ).resolves.toMatchObject({
      source: 'email',
      extractionConfidence: 0.85,
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'email',
        extraction_confidence: 0.85,
      }),
    );
  });

  it('uses one conditional update path for completion', async () => {
    const completedRow = {
      ...row,
      status: 'completed',
      completed_at: '2026-07-19T12:00:00.000Z',
      updated_at: '2026-07-19T12:00:00.000Z',
    };
    const maybeSingle = jest
      .fn()
      .mockResolvedValue({ data: completedRow, error: null });
    const eq = jest.fn();
    const query = {
      eq,
      select: jest.fn(() => ({ maybeSingle })),
    };
    eq.mockReturnValue(query);
    const update = jest.fn(() => query);
    const repository = new SupabaseFinancialItemsRepository(
      asClient({ from: () => ({ update }) }),
      userId,
    );

    await expect(repository.completeItem(row.id)).resolves.toMatchObject({
      status: 'completed',
    });
    expect(update).toHaveBeenCalledWith({ status: 'completed' });
    expect(eq).toHaveBeenNthCalledWith(1, 'user_id', userId);
    expect(eq).toHaveBeenNthCalledWith(2, 'id', row.id);
    expect(eq).toHaveBeenNthCalledWith(3, 'status', 'active');
  });

  it('calls the fixed no-argument bootstrap RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: true, error: null });
    const repository = new SupabaseFinancialItemsRepository(
      asClient({ rpc }),
      userId,
    );

    await repository.ensureInitialSeed();
    expect(rpc).toHaveBeenCalledWith('bootstrap_financial_items');
  });

  it('rejects a row owned by another user', async () => {
    const single = jest.fn().mockResolvedValue({
      data: { ...row, user_id: 'another-user' },
      error: null,
    });
    const repository = new SupabaseFinancialItemsRepository(
      asClient({
        from: () => ({ insert: () => ({ select: () => ({ single }) }) }),
      }),
      userId,
    );

    await expect(repository.createItem(input)).rejects.toMatchObject({
      operation: 'create',
    });
  });

  it('normalizes database failures without exposing backend messages', async () => {
    const privateError = new Error('private database details');
    const single = jest.fn().mockResolvedValue({
      data: null,
      error: privateError,
    });
    const repository = new SupabaseFinancialItemsRepository(
      asClient({
        from: () => ({ insert: () => ({ select: () => ({ single }) }) }),
      }),
      userId,
    );

    await expect(repository.createItem(input)).rejects.toEqual(
      expect.objectContaining<Partial<FinancialItemsRepositoryError>>({
        name: 'FinancialItemsRepositoryError',
        operation: 'create',
      }),
    );
    await repository.createItem(input).catch((error: unknown) => {
      expect((error as Error).message).not.toContain(privateError.message);
    });
  });
});
