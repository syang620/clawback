import type {
  ExtractionWarning,
  ExtractionWarningCode,
  ExtractionWarningField,
  FinancialEmailCandidate,
  FinancialEmailExtraction,
} from '@/features/email-parser/types';
import type { FinancialItemKind, Recurrence } from '@/types/financial-item';

const kinds = new Set<FinancialItemKind>(['trial', 'perk', 'subscription']);
const recurrences = new Set<Recurrence>([
  'none',
  'monthly',
  'quarterly',
  'annual',
  'custom',
]);
const warningCodes = new Set<ExtractionWarningCode>([
  'missing_deadline',
  'ambiguous_deadline',
  'inferred_year',
  'missing_merchant',
  'missing_amount',
  'conflicting_amounts',
  'unverified_action_url',
  'unsupported_task',
  'low_confidence',
  'unsupported_currency',
  'multiple_dates',
  'normalized_relative_date',
]);
const warningFields = new Set<ExtractionWarningField>([
  'general',
  'merchantName',
  'title',
  'kind',
  'valueAmount',
  'chargeAmount',
  'deadlineDate',
  'recurrence',
  'actionUrl',
]);

export class InvalidEmailExtractionEnvelopeError extends Error {
  constructor() {
    super('The email extraction response was not valid.');
    this.name = 'InvalidEmailExtractionEnvelopeError';
  }
}

export function parseFinancialEmailExtractionEnvelope(
  input: unknown,
  emailText: string,
): FinancialEmailExtraction {
  const envelope = requireRecord(input);
  assertOnlyKeys(envelope, ['ok', 'extraction']);
  if (envelope.ok !== true) throw invalidEnvelope();

  const extraction = requireRecord(envelope.extraction);
  assertOnlyKeys(extraction, [
    'isActionable',
    'candidate',
    'confidence',
    'warnings',
  ]);
  const confidence = requireConfidence(extraction.confidence);
  const warnings = requireWarnings(extraction.warnings);

  if (extraction.isActionable === false) {
    if (extraction.candidate !== null) throw invalidEnvelope();
    return { isActionable: false, candidate: null, confidence, warnings };
  }
  if (extraction.isActionable !== true) throw invalidEnvelope();

  return {
    isActionable: true,
    candidate: requireCandidate(extraction.candidate, emailText),
    confidence,
    warnings,
  };
}

export function parseFinancialEmailFailureEnvelope(input: unknown): {
  code: string;
  retryable: boolean;
} {
  const envelope = requireRecord(input);
  assertOnlyKeys(envelope, ['ok', 'error']);
  if (envelope.ok !== false) throw invalidEnvelope();
  const error = requireRecord(envelope.error);
  assertOnlyKeys(error, ['code', 'message', 'retryable']);
  if (
    typeof error.code !== 'string' ||
    typeof error.message !== 'string' ||
    typeof error.retryable !== 'boolean'
  ) {
    throw invalidEnvelope();
  }
  return { code: error.code, retryable: error.retryable };
}

function requireCandidate(input: unknown, emailText: string) {
  const candidate = requireRecord(input);
  assertOnlyKeys(candidate, [
    'merchantName',
    'title',
    'kind',
    'valueCents',
    'chargeAmountCents',
    'deadlineDate',
    'recurrence',
    'actionUrl',
  ]);

  return {
    merchantName: nullableString(candidate.merchantName, 200),
    title: nullableString(candidate.title, 200),
    kind: nullableEnum(candidate.kind, kinds),
    valueCents: nullableMoney(candidate.valueCents),
    chargeAmountCents: nullableMoney(candidate.chargeAmountCents),
    deadlineDate: nullableDate(candidate.deadlineDate),
    recurrence: nullableEnum(candidate.recurrence, recurrences),
    actionUrl: nullableActionUrl(candidate.actionUrl, emailText),
  } satisfies FinancialEmailCandidate;
}

function requireWarnings(input: unknown): ExtractionWarning[] {
  if (!Array.isArray(input) || input.length > 12) throw invalidEnvelope();
  return input.map((inputWarning) => {
    const warning = requireRecord(inputWarning);
    assertOnlyKeys(warning, ['code', 'field', 'message']);
    if (
      typeof warning.code !== 'string' ||
      !warningCodes.has(warning.code as ExtractionWarningCode) ||
      typeof warning.field !== 'string' ||
      !warningFields.has(warning.field as ExtractionWarningField) ||
      typeof warning.message !== 'string' ||
      !warning.message.trim() ||
      warning.message.length > 240
    ) {
      throw invalidEnvelope();
    }
    return {
      code: warning.code as ExtractionWarningCode,
      field: warning.field as ExtractionWarningField,
      message: warning.message.trim(),
    };
  });
}

function requireConfidence(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw invalidEnvelope();
  }
  return value;
}

function nullableString(value: unknown, maxLength: number): string | null {
  if (value === null) return null;
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value !== value.trim() ||
    value.length > maxLength
  ) {
    throw invalidEnvelope();
  }
  return value;
}

function nullableEnum<Value extends string>(
  value: unknown,
  supported: Set<Value>,
): Value | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !supported.has(value as Value)) {
    throw invalidEnvelope();
  }
  return value as Value;
}

function nullableMoney(value: unknown): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw invalidEnvelope();
  }
  return value as number;
}

function nullableDate(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw invalidEnvelope();
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw invalidEnvelope();
  }
  return value;
}

function nullableActionUrl(value: unknown, emailText: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length > 2048) {
    throw invalidEnvelope();
  }
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.href !== value ||
      !emailText.includes(value)
    ) {
      throw invalidEnvelope();
    }
  } catch (error) {
    if (error instanceof InvalidEmailExtractionEnvelopeError) throw error;
    throw invalidEnvelope();
  }
  return value;
}

function requireRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw invalidEnvelope();
  }
  return input as Record<string, unknown>;
}

function assertOnlyKeys(
  input: Record<string, unknown>,
  allowed: readonly string[],
): void {
  if (
    Object.keys(input).length !== allowed.length ||
    Object.keys(input).some((key) => !allowed.includes(key)) ||
    allowed.some((key) => !(key in input))
  ) {
    throw invalidEnvelope();
  }
}

function invalidEnvelope(): InvalidEmailExtractionEnvelopeError {
  return new InvalidEmailExtractionEnvelopeError();
}
