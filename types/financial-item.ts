export type FinancialItemKind = 'trial' | 'perk' | 'subscription';

export type FinancialItemStatus = 'active' | 'completed' | 'expired';

export type FinancialItemSource = 'manual' | 'email' | 'demo';

export type Recurrence = 'none' | 'monthly' | 'quarterly' | 'annual' | 'custom';

export interface FinancialItem {
  id: string;
  userId: string | null;
  kind: FinancialItemKind;
  title: string;
  provider: string | null;
  valueCents: number | null;
  chargeAmountCents: number | null;
  dueAt: string;
  recurrence: Recurrence;
  actionUrl: string | null;
  status: FinancialItemStatus;
  source: FinancialItemSource;
  extractionConfidence: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface FinancialItemCreateFields {
  kind: FinancialItemKind;
  title: string;
  provider: string | null;
  valueCents: number | null;
  chargeAmountCents: number | null;
  dueAt: string;
  recurrence: Recurrence;
  actionUrl: string | null;
}

export type CreateFinancialItemInput = FinancialItemCreateFields &
  (
    | { source: 'manual'; extractionConfidence: null }
    | { source: 'email'; extractionConfidence: number }
  );

export type UpdateFinancialItemInput = Partial<FinancialItemCreateFields>;
