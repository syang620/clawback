import type {
  CreateFinancialItemInput,
  FinancialItem,
  UpdateFinancialItemInput,
} from '@/types/financial-item';

export interface FinancialItemsRepository {
  listItems(): Promise<FinancialItem[]>;
  getItem(id: string): Promise<FinancialItem | null>;
  createItem(input: CreateFinancialItemInput): Promise<FinancialItem>;
  updateItem(
    id: string,
    input: UpdateFinancialItemInput,
  ): Promise<FinancialItem | null>;
  completeItem(id: string): Promise<FinancialItem | null>;
  restoreItem(id: string): Promise<FinancialItem | null>;
  deleteItem(id: string): Promise<boolean>;
  ensureInitialSeed(referenceDate?: Date): Promise<void>;
}

export type FinancialItemsRepositoryOperation =
  | 'list'
  | 'get'
  | 'create'
  | 'update'
  | 'complete'
  | 'restore'
  | 'delete'
  | 'seed';

export class FinancialItemsRepositoryError extends Error {
  constructor(
    public readonly operation: FinancialItemsRepositoryOperation,
    options?: { cause?: unknown },
  ) {
    super(
      `Financial items repository operation failed: ${operation}.`,
      options,
    );
    this.name = 'FinancialItemsRepositoryError';
  }
}
