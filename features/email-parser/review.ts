import type {
  FinancialEmailCandidate,
  FinancialEmailExtraction,
} from '@/features/email-parser/types';
import type { FinancialItemEditorValues } from '@/features/financial-items/components/financial-item-fields';
import type { ManualFinancialItemErrors } from '@/features/financial-items/logic/manual-entry';
import { parseCalendarDateInput } from '@/lib/dates';
import { parseDollarInput } from '@/lib/money';
import { getSafeHttpsUrl } from '@/lib/urls';
import type { CreateFinancialItemInput } from '@/types/financial-item';

export type EmailReviewValues = FinancialItemEditorValues;

export type EmailReviewValidationResult =
  | { ok: true; input: CreateFinancialItemInput }
  | { ok: false; errors: ManualFinancialItemErrors };

export function createEmailReviewValues(
  candidate: FinancialEmailCandidate,
): EmailReviewValues {
  return {
    kind: candidate.kind,
    title: candidate.title ?? '',
    provider: candidate.merchantName ?? '',
    deadline: candidate.deadlineDate ?? '',
    valueAvailable: formatCentsForInput(candidate.valueCents),
    chargeAtRisk: formatCentsForInput(candidate.chargeAmountCents),
    recurrence: candidate.recurrence,
    actionUrl: candidate.actionUrl ?? '',
  };
}

export function validateEmailReview(
  values: EmailReviewValues,
  confidence: number,
): EmailReviewValidationResult {
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
  if (!values.recurrence) {
    errors.recurrence = 'Choose a recurrence, including One time.';
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
    !values.recurrence ||
    (actionUrlValue && !actionUrl) ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
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
      source: 'email',
      extractionConfidence: confidence,
    },
  };
}

export function isActionableExtraction(
  extraction: FinancialEmailExtraction,
): extraction is Extract<FinancialEmailExtraction, { isActionable: true }> {
  return extraction.isActionable;
}

function formatCentsForInput(valueCents: number | null): string {
  if (valueCents === null) return '';
  return `${Math.floor(valueCents / 100)}.${String(valueCents % 100).padStart(2, '0')}`;
}

function moneyError(reason: 'invalid' | 'too-large'): string {
  return reason === 'too-large'
    ? 'Enter a smaller dollar amount.'
    : 'Enter a non-negative dollar amount with no more than two decimal places.';
}
