import { LocalFinancialItemsRepository } from '@/services/financial-items/local-financial-items-repository';
import type { CreateFinancialItemInput } from '@/types/financial-item';

const input: CreateFinancialItemInput = {
  kind: 'subscription',
  title: 'Review renewal',
  provider: 'Example Service',
  valueCents: null,
  chargeAmountCents: 14900,
  dueAt: '2026-08-15T12:00:00.000Z',
  recurrence: 'annual',
  actionUrl: 'https://example.com/account',
};

describe('Checkpoint 4A local repository', () => {
  it('provides asynchronous create, update, complete, restore, and delete parity', async () => {
    const times = [
      new Date('2026-07-18T12:00:00.000Z'),
      new Date('2026-07-19T12:00:00.000Z'),
      new Date('2026-07-20T12:00:00.000Z'),
      new Date('2026-07-21T12:00:00.000Z'),
    ];
    const repository = new LocalFinancialItemsRepository({
      initialItems: [],
      clock: () => times.shift() ?? new Date('2026-07-22T12:00:00.000Z'),
    });

    const created = await repository.createItem(input);
    expect(created).toMatchObject({ source: 'manual', status: 'active' });
    expect((await repository.listItems()).length).toBe(1);

    const updated = await repository.updateItem(created.id, {
      title: 'Updated renewal',
    });
    expect(updated?.title).toBe('Updated renewal');

    const completed = await repository.completeItem(created.id);
    expect(completed?.status).toBe('completed');
    expect(await repository.completeItem(created.id)).toBeNull();

    const restored = await repository.restoreItem(created.id);
    expect(restored?.status).toBe('active');
    expect(restored?.completedAt).toBeNull();

    expect(await repository.deleteItem(created.id)).toBe(true);
    expect(await repository.deleteItem(created.id)).toBe(false);
    expect(await repository.getItem(created.id)).toBeNull();
  });

  it('retains the current three deterministic demo items by default', async () => {
    const repository = new LocalFinancialItemsRepository({
      referenceDate: new Date('2026-07-18T00:00:00.000Z'),
    });
    const items = await repository.listItems();

    expect(items).toHaveLength(3);
    expect(items.every((item) => item.source === 'demo')).toBe(true);
    await expect(repository.ensureInitialSeed()).resolves.toBeUndefined();
  });
});
