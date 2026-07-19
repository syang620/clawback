import { parseCalendarDateInput } from '@/lib/dates';
import { parseDollarInput } from '@/lib/money';
import { getSafeHttpsUrl } from '@/lib/urls';
import { assertCreateFinancialItemProvenance } from '@/features/financial-items/logic/create-financial-item';
import type {
  CreateFinancialItemInput,
  FinancialItem,
  FinancialItemKind,
  Recurrence,
} from '@/types/financial-item';

export interface ManualFinancialItemFormValues {
  kind: FinancialItemKind | null;
  title: string;
  provider: string;
  deadline: string;
  valueAvailable: string;
  chargeAtRisk: string;
  recurrence: Recurrence;
  actionUrl: string;
}

export type ManualFinancialItemField =
  | 'kind'
  | 'title'
  | 'deadline'
  | 'valueAvailable'
  | 'chargeAtRisk'
  | 'recurrence'
  | 'actionUrl';

export type ManualFinancialItemErrors = Partial<
  Record<ManualFinancialItemField, string>
>;

export type ManualFinancialItemValidationResult =
  | { ok: true; input: CreateFinancialItemInput }
  | { ok: false; errors: ManualFinancialItemErrors };

export const financialItemKinds: FinancialItemKind[] = [
  'trial',
  'perk',
  'subscription',
];

export const recurrenceOptions: Recurrence[] = [
  'none',
  'monthly',
  'quarterly',
  'annual',
  'custom',
];

export function isFinancialItemKind(
  value: string | null | undefined,
): value is FinancialItemKind {
  return financialItemKinds.some((kind) => kind === value);
}

export function createEmptyManualFinancialItemForm(
  kind: FinancialItemKind | null = null,
): ManualFinancialItemFormValues {
  return {
    kind,
    title: '',
    provider: '',
    deadline: '',
    valueAvailable: '',
    chargeAtRisk: '',
    recurrence: 'none',
    actionUrl: '',
  };
}

function moneyError(reason: 'invalid' | 'too-large'): string {
  return reason === 'too-large'
    ? 'Enter a smaller dollar amount.'
    : 'Enter a non-negative dollar amount with no more than two decimal places.';
}

export function validateManualFinancialItem(
  values: ManualFinancialItemFormValues,
): ManualFinancialItemValidationResult {
  const errors: ManualFinancialItemErrors = {};
  const title = values.title.trim();
  const provider = values.provider.trim();
  const deadline = parseCalendarDateInput(values.deadline);
  const valueAvailable = parseDollarInput(values.valueAvailable);
  const chargeAtRisk = parseDollarInput(values.chargeAtRisk);
  const actionUrlValue = values.actionUrl.trim();
  const actionUrl = actionUrlValue ? getSafeHttpsUrl(actionUrlValue) : null;

  if (!values.kind) errors.kind = 'Choose a task type.';
  if (!title) errors.title = 'Enter a title.';
  if (!values.deadline.trim()) {
    errors.deadline = 'Enter a deadline.';
  } else if (!deadline.ok) {
    errors.deadline = 'Enter a real calendar date in YYYY-MM-DD format.';
  }
  if (!valueAvailable.ok) {
    errors.valueAvailable = moneyError(valueAvailable.reason);
  }
  if (!chargeAtRisk.ok) {
    errors.chargeAtRisk = moneyError(chargeAtRisk.reason);
  }
  if (actionUrlValue && !actionUrl) {
    errors.actionUrl = 'Enter a full HTTPS URL without a username or password.';
  }

  if (
    !values.kind ||
    !title ||
    !deadline.ok ||
    !valueAvailable.ok ||
    !chargeAtRisk.ok ||
    (actionUrlValue && !actionUrl)
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    input: {
      kind: values.kind,
      title,
      provider: provider || null,
      valueCents: valueAvailable.valueCents,
      chargeAmountCents: chargeAtRisk.valueCents,
      dueAt: deadline.isoDate,
      recurrence: values.recurrence,
      actionUrl: actionUrl?.href ?? null,
      source: 'manual',
      extractionConfidence: null,
    },
  };
}

export function createManualFinancialItem(
  input: CreateFinancialItemInput,
  id: string,
  createdAt: Date,
): FinancialItem {
  assertCreateFinancialItemProvenance(input);
  if (!id) throw new RangeError('Manual financial item id is required.');
  if (Number.isNaN(createdAt.getTime())) {
    throw new RangeError('Creation date must be valid.');
  }

  const timestamp = createdAt.toISOString();
  return {
    ...input,
    id,
    userId: null,
    status: 'active',
    source: input.source,
    extractionConfidence: input.extractionConfidence,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  };
}
