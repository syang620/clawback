import type { SupabaseClient } from '@supabase/supabase-js';

import {
  mapFinancialItemRow,
  toFinancialItemInsert,
  toFinancialItemUpdate,
} from '@/services/financial-items/mapping';
import {
  FinancialItemsRepositoryError,
  type FinancialItemsRepository,
  type FinancialItemsRepositoryOperation,
} from '@/services/financial-items/repository';
import type { Database } from '@/types/database';
import type {
  CreateFinancialItemInput,
  FinancialItem,
  UpdateFinancialItemInput,
} from '@/types/financial-item';

export class SupabaseFinancialItemsRepository implements FinancialItemsRepository {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly userId: string,
  ) {
    if (!userId) throw new RangeError('A Supabase user ID is required.');
  }

  async listItems(): Promise<FinancialItem[]> {
    const { data, error } = await this.client
      .from('financial_items')
      .select('*')
      .eq('user_id', this.userId);
    if (error) this.fail('list', error);
    return (data ?? []).map((row) => this.mapOwnedRow(row, 'list'));
  }

  async getItem(id: string): Promise<FinancialItem | null> {
    const { data, error } = await this.client
      .from('financial_items')
      .select('*')
      .eq('user_id', this.userId)
      .eq('id', id)
      .maybeSingle();
    if (error) this.fail('get', error);
    return data ? this.mapOwnedRow(data, 'get') : null;
  }

  async createItem(input: CreateFinancialItemInput): Promise<FinancialItem> {
    const { data, error } = await this.client
      .from('financial_items')
      .insert(toFinancialItemInsert(input, this.userId))
      .select('*')
      .single();
    if (error || !data) this.fail('create', error);
    return this.mapOwnedRow(data, 'create');
  }

  async updateItem(
    id: string,
    input: UpdateFinancialItemInput,
  ): Promise<FinancialItem | null> {
    const { data, error } = await this.client
      .from('financial_items')
      .update(toFinancialItemUpdate(input))
      .eq('user_id', this.userId)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) this.fail('update', error);
    return data ? this.mapOwnedRow(data, 'update') : null;
  }

  async completeItem(id: string): Promise<FinancialItem | null> {
    return this.transitionItem(id, 'active', 'completed', 'complete');
  }

  async restoreItem(id: string): Promise<FinancialItem | null> {
    return this.transitionItem(id, 'completed', 'active', 'restore');
  }

  async deleteItem(id: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('financial_items')
      .delete()
      .eq('user_id', this.userId)
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) this.fail('delete', error);
    return data !== null;
  }

  async ensureInitialSeed(): Promise<void> {
    const { error } = await this.client.rpc('bootstrap_financial_items');
    if (error) this.fail('seed', error);
  }

  private async transitionItem(
    id: string,
    currentStatus: 'active' | 'completed',
    nextStatus: 'active' | 'completed',
    operation: 'complete' | 'restore',
  ): Promise<FinancialItem | null> {
    const { data, error } = await this.client
      .from('financial_items')
      .update({ status: nextStatus })
      .eq('user_id', this.userId)
      .eq('id', id)
      .eq('status', currentStatus)
      .select('*')
      .maybeSingle();
    if (error) this.fail(operation, error);
    return data ? this.mapOwnedRow(data, operation) : null;
  }

  private mapOwnedRow(
    row: unknown,
    operation: FinancialItemsRepositoryOperation,
  ): FinancialItem {
    try {
      const item = mapFinancialItemRow(row);
      if (item.userId !== this.userId) {
        throw new TypeError('Supabase returned a row owned by another user.');
      }
      return item;
    } catch (error) {
      this.fail(operation, error);
    }
  }

  private fail(
    operation: FinancialItemsRepositoryOperation,
    cause: unknown,
  ): never {
    throw new FinancialItemsRepositoryError(operation, { cause });
  }
}
