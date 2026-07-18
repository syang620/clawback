import { createDemoItems } from '@/constants/demo-data';
import { createManualFinancialItem } from '@/features/financial-items/logic/manual-entry';
import {
  completeFinancialItem,
  restoreFinancialItem,
} from '@/features/financial-items/logic/status-transitions';
import type { FinancialItemsRepository } from '@/services/financial-items/repository';
import type {
  CreateFinancialItemInput,
  FinancialItem,
  UpdateFinancialItemInput,
} from '@/types/financial-item';

interface LocalFinancialItemsRepositoryOptions {
  clock?: () => Date;
  initialItems?: FinancialItem[];
  referenceDate?: Date;
}

export class LocalFinancialItemsRepository implements FinancialItemsRepository {
  private items: FinancialItem[];
  private sequence = 0;
  private readonly clock: () => Date;

  constructor(options: LocalFinancialItemsRepositoryOptions = {}) {
    this.clock = options.clock ?? (() => new Date());
    this.items = (
      options.initialItems ??
      createDemoItems(options.referenceDate ?? this.clock())
    ).slice();
  }

  async listItems(): Promise<FinancialItem[]> {
    return this.items.slice();
  }

  async getItem(id: string): Promise<FinancialItem | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async createItem(input: CreateFinancialItemInput): Promise<FinancialItem> {
    const createdAt = this.clock();
    this.sequence += 1;
    const item = createManualFinancialItem(
      input,
      `manual-${createdAt.getTime()}-${this.sequence}`,
      createdAt,
    );
    this.items = [...this.items, item];
    return item;
  }

  async updateItem(
    id: string,
    input: UpdateFinancialItemInput,
  ): Promise<FinancialItem | null> {
    const current = await this.getItem(id);
    if (!current) return null;

    const updated: FinancialItem = {
      ...current,
      ...input,
      updatedAt: this.clock().toISOString(),
    };
    this.replaceItem(updated);
    return updated;
  }

  async completeItem(id: string): Promise<FinancialItem | null> {
    const current = await this.getItem(id);
    if (!current || current.status !== 'active') return null;

    const completed = completeFinancialItem(current, this.clock());
    this.replaceItem(completed);
    return completed;
  }

  async restoreItem(id: string): Promise<FinancialItem | null> {
    const current = await this.getItem(id);
    if (!current || current.status !== 'completed') return null;

    const restored = restoreFinancialItem(current, this.clock());
    this.replaceItem(restored);
    return restored;
  }

  async deleteItem(id: string): Promise<boolean> {
    const nextItems = this.items.filter((item) => item.id !== id);
    if (nextItems.length === this.items.length) return false;
    this.items = nextItems;
    return true;
  }

  async ensureInitialSeed(): Promise<void> {
    return undefined;
  }

  private replaceItem(nextItem: FinancialItem): void {
    this.items = this.items.map((item) =>
      item.id === nextItem.id ? nextItem : item,
    );
  }
}
