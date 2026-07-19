import { formatCalendarDateInput } from '@/lib/dates';
import { getSafeHttpsUrl } from '@/lib/urls';
import { assertCreateFinancialItemProvenance } from '@/features/financial-items/logic/create-financial-item';
import type { Database } from '@/types/database';
import type {
  CreateFinancialItemInput,
  FinancialItem,
  FinancialItemKind,
  FinancialItemSource,
  FinancialItemStatus,
  Recurrence,
  UpdateFinancialItemInput,
} from '@/types/financial-item';

export type FinancialItemRow =
  Database['public']['Tables']['financial_items']['Row'];
export type FinancialItemInsert =
  Database['public']['Tables']['financial_items']['Insert'];
export type FinancialItemUpdate =
  Database['public']['Tables']['financial_items']['Update'];

const kinds: FinancialItemKind[] = ['trial', 'perk', 'subscription'];
const statuses: FinancialItemStatus[] = ['active', 'completed', 'expired'];
const sources: FinancialItemSource[] = ['manual', 'email', 'demo'];
const recurrences: Recurrence[] = [
  'none',
  'monthly',
  'quarterly',
  'annual',
  'custom',
];

function isMember<Value extends string>(
  value: unknown,
  supported: Value[],
): value is Value {
  return typeof value === 'string' && supported.includes(value as Value);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`Invalid financial item ${field}.`);
  }
  return value;
}

function optionalString(value: unknown, field: string): string | null {
  if (value === null) return null;
  return requireString(value, field);
}

function optionalMoney(value: unknown, field: string): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new TypeError(`Invalid financial item ${field}.`);
  }
  return value as number;
}

function timestamp(value: unknown, field: string): string {
  const raw = requireString(value, field);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid financial item ${field}.`);
  }
  return date.toISOString();
}

function optionalTimestamp(value: unknown, field: string): string | null {
  return value === null ? null : timestamp(value, field);
}

export function mapFinancialItemRow(value: unknown): FinancialItem {
  if (!value || typeof value !== 'object') {
    throw new TypeError('Invalid financial item row.');
  }

  const row = value as Record<string, unknown>;
  const kind = row.kind;
  const status = row.status;
  const source = row.source;
  const recurrence = row.recurrence;
  if (!isMember(kind, kinds)) throw new TypeError('Invalid item kind.');
  if (!isMember(status, statuses)) throw new TypeError('Invalid item status.');
  if (!isMember(source, sources)) throw new TypeError('Invalid item source.');
  if (!isMember(recurrence, recurrences)) {
    throw new TypeError('Invalid item recurrence.');
  }

  const actionUrl = optionalString(row.action_url, 'action URL');
  if (actionUrl !== null && !getSafeHttpsUrl(actionUrl)) {
    throw new TypeError('Invalid financial item action URL.');
  }

  const extractionConfidence = row.extraction_confidence;
  if (
    extractionConfidence !== null &&
    (typeof extractionConfidence !== 'number' ||
      !Number.isFinite(extractionConfidence) ||
      extractionConfidence < 0 ||
      extractionConfidence > 1)
  ) {
    throw new TypeError('Invalid financial item extraction confidence.');
  }
  if (
    (source === 'email' && extractionConfidence === null) ||
    (source !== 'email' && extractionConfidence !== null)
  ) {
    throw new TypeError('Invalid financial item provenance.');
  }

  const title = requireString(row.title, 'title').trim();
  if (!title) throw new TypeError('Invalid financial item title.');

  return {
    id: requireString(row.id, 'id'),
    userId: requireString(row.user_id, 'user ID'),
    kind,
    title,
    provider: optionalString(row.provider, 'provider'),
    valueCents: optionalMoney(row.value_cents, 'value'),
    chargeAmountCents: optionalMoney(row.charge_amount_cents, 'charge'),
    dueAt: timestamp(row.due_at, 'deadline'),
    recurrence,
    actionUrl,
    status,
    source,
    extractionConfidence: extractionConfidence as number | null,
    createdAt: timestamp(row.created_at, 'created timestamp'),
    updatedAt: timestamp(row.updated_at, 'updated timestamp'),
    completedAt: optionalTimestamp(row.completed_at, 'completed timestamp'),
  };
}

export function toFinancialItemInsert(
  input: CreateFinancialItemInput,
  userId: string,
): FinancialItemInsert {
  assertCreateFinancialItemProvenance(input);
  return {
    user_id: userId,
    kind: input.kind,
    title: input.title,
    provider: input.provider,
    value_cents: input.valueCents,
    charge_amount_cents: input.chargeAmountCents,
    due_at: input.dueAt,
    recurrence: input.recurrence,
    action_url: input.actionUrl,
    status: 'active',
    source: input.source,
    extraction_confidence: input.extractionConfidence,
    completed_at: null,
  };
}

export function toFinancialItemUpdate(
  input: UpdateFinancialItemInput,
): FinancialItemUpdate {
  const update: FinancialItemUpdate = {};
  if (input.kind !== undefined) update.kind = input.kind;
  if (input.title !== undefined) update.title = input.title;
  if (input.provider !== undefined) update.provider = input.provider;
  if (input.valueCents !== undefined) update.value_cents = input.valueCents;
  if (input.chargeAmountCents !== undefined) {
    update.charge_amount_cents = input.chargeAmountCents;
  }
  if (input.dueAt !== undefined) update.due_at = input.dueAt;
  if (input.recurrence !== undefined) update.recurrence = input.recurrence;
  if (input.actionUrl !== undefined) update.action_url = input.actionUrl;
  return update;
}

export function calendarDateFromFinancialItemRow(
  row: FinancialItemRow,
): string {
  return formatCalendarDateInput(timestamp(row.due_at, 'deadline'));
}
