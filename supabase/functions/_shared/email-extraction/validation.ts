import { errors } from "./errors.ts";
import type {
  ExtractionContext,
  ExtractionWarning,
  ExtractionWarningCode,
  ExtractionWarningField,
  FinancialEmailExtraction,
  FinancialItemKind,
  GeneratedFinancialEmailCandidate,
  GeneratedFinancialEmailExtraction,
  ParseFinancialEmailRequest,
  Recurrence,
} from "./types.ts";

const KINDS = new Set<FinancialItemKind>([
  "trial",
  "perk",
  "subscription",
]);
const RECURRENCES = new Set<Recurrence>([
  "none",
  "monthly",
  "quarterly",
  "annual",
  "custom",
]);
const WARNING_CODES = new Set<ExtractionWarningCode>([
  "missing_deadline",
  "ambiguous_deadline",
  "inferred_year",
  "missing_merchant",
  "missing_amount",
  "conflicting_amounts",
  "unverified_action_url",
  "unsupported_task",
  "low_confidence",
  "unsupported_currency",
  "multiple_dates",
  "normalized_relative_date",
]);
const WARNING_FIELDS = new Set<ExtractionWarningField>([
  "general",
  "merchantName",
  "title",
  "kind",
  "valueAmount",
  "chargeAmount",
  "deadlineDate",
  "recurrence",
  "actionUrl",
]);
const MONEY_PATTERN = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseFinancialEmailRequest(
  input: unknown,
): ParseFinancialEmailRequest {
  if (!isRecord(input)) {
    throw errors.invalidRequest("The extraction request is not valid.");
  }
  const object = input;
  assertOnlyKeys(
    object,
    [
      "emailText",
      "subject",
      "emailSentDate",
      "userTimeZone",
      "referenceDate",
    ],
    () => errors.invalidRequest("The extraction request is not valid."),
  );
  const emailText = requireString(object.emailText).trim();
  if (!emailText) {
    throw errors.invalidRequest("Paste email text before extracting a task.");
  }
  if (emailText.length > 20_000) {
    throw errors.invalidRequest(
      "The email is too long. Paste only the relevant portion (20,000 characters maximum).",
    );
  }

  const subject = optionalTrimmedString(object.subject, 500, "subject");
  const userTimeZone = requireString(object.userTimeZone).trim();
  if (!isIanaTimeZone(userTimeZone)) {
    throw errors.invalidRequest("The supplied timezone is not valid.");
  }

  const referenceDate = requireDateOnly(object.referenceDate, "reference date");
  const emailSentDate = optionalDateOnly(
    object.emailSentDate,
    "email sent date",
  );

  return {
    emailText,
    ...(subject ? { subject } : {}),
    ...(emailSentDate ? { emailSentDate } : {}),
    userTimeZone,
    referenceDate,
  };
}

export function extractionContextFromRequest(
  request: ParseFinancialEmailRequest,
): ExtractionContext {
  return {
    ...(request.subject ? { subject: request.subject } : {}),
    ...(request.emailSentDate ? { emailSentDate: request.emailSentDate } : {}),
    userTimeZone: request.userTimeZone,
    referenceDate: request.referenceDate,
  };
}

export function parseGeneratedExtraction(
  input: unknown,
): GeneratedFinancialEmailExtraction {
  const object = requireRecord(input);
  assertOnlyKeys(
    object,
    ["isActionable", "candidate", "confidence", "warnings"],
    invalidModelOutput,
  );
  if (typeof object.isActionable !== "boolean") throw invalidModelOutput();
  const confidence = requireConfidence(object.confidence);
  const warnings = requireWarnings(object.warnings);

  if (!object.isActionable) {
    if (object.candidate !== null) throw invalidModelOutput();
    return { isActionable: false, candidate: null, confidence, warnings };
  }

  if (!isRecord(object.candidate)) throw invalidModelOutput();
  return {
    isActionable: true,
    candidate: requireCandidate(object.candidate),
    confidence,
    warnings,
  };
}

export function normalizeExtraction(
  extraction: GeneratedFinancialEmailExtraction,
  emailText: string,
): FinancialEmailExtraction {
  if (!extraction.isActionable) return extraction;

  const warnings = [...extraction.warnings];
  const actionUrl = normalizeActionUrl(
    extraction.candidate.actionUrl,
    emailText,
    warnings,
  );

  return {
    isActionable: true,
    candidate: {
      merchantName: extraction.candidate.merchantName,
      title: extraction.candidate.title,
      kind: extraction.candidate.kind,
      valueCents: decimalAmountToCents(extraction.candidate.valueAmount),
      chargeAmountCents: decimalAmountToCents(
        extraction.candidate.chargeAmount,
      ),
      deadlineDate: extraction.candidate.deadlineDate,
      recurrence: extraction.candidate.recurrence,
      actionUrl,
    },
    confidence: extraction.confidence,
    warnings,
  };
}

export function decimalAmountToCents(value: string | null): number | null {
  if (value === null) return null;
  if (!MONEY_PATTERN.test(value)) throw invalidModelOutput();

  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 0) throw invalidModelOutput();
  return cents;
}

export function isValidDateOnly(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function requireCandidate(input: Record<string, unknown>) {
  assertOnlyKeys(
    input,
    [
      "merchantName",
      "title",
      "kind",
      "valueAmount",
      "chargeAmount",
      "deadlineDate",
      "recurrence",
      "actionUrl",
    ],
    invalidModelOutput,
  );
  const candidate: GeneratedFinancialEmailCandidate = {
    merchantName: nullableTrimmedString(input.merchantName, 200),
    title: nullableTrimmedString(input.title, 200),
    kind: nullableEnum(input.kind, KINDS),
    valueAmount: nullableMoney(input.valueAmount),
    chargeAmount: nullableMoney(input.chargeAmount),
    deadlineDate: nullableDateOnly(input.deadlineDate),
    recurrence: nullableEnum(input.recurrence, RECURRENCES),
    actionUrl: nullableTrimmedString(input.actionUrl, 2048),
  };
  return candidate;
}

function requireWarnings(input: unknown): ExtractionWarning[] {
  if (!Array.isArray(input) || input.length > 12) throw invalidModelOutput();
  return input.map((warning) => {
    const object = requireRecord(warning);
    assertOnlyKeys(
      object,
      ["code", "field", "message"],
      invalidModelOutput,
    );
    const code = object.code;
    const field = object.field;
    const message = requireString(object.message).trim();
    if (
      typeof code !== "string" ||
      !WARNING_CODES.has(code as ExtractionWarningCode) ||
      typeof field !== "string" ||
      !WARNING_FIELDS.has(field as ExtractionWarningField) ||
      !message ||
      message.length > 240
    ) {
      throw invalidModelOutput();
    }
    return {
      code: code as ExtractionWarningCode,
      field: field as ExtractionWarningField,
      message,
    };
  });
}

function normalizeActionUrl(
  value: string | null,
  emailText: string,
  warnings: ExtractionWarning[],
): string | null {
  if (value === null) return null;

  try {
    const url = new URL(value);
    if (url.protocol === "https:" && emailText.includes(value)) return value;
  } catch {
    // The warning below is the only externally visible detail.
  }

  if (!warnings.some((warning) => warning.code === "unverified_action_url")) {
    warnings.push({
      code: "unverified_action_url",
      field: "actionUrl",
      message: "The action link was removed because it could not be verified.",
    });
  }
  return null;
}

function requireConfidence(input: unknown): number {
  if (
    typeof input !== "number" ||
    !Number.isFinite(input) ||
    input < 0 ||
    input > 1
  ) {
    throw invalidModelOutput();
  }
  return input;
}

function nullableMoney(input: unknown): string | null {
  if (input === null) return null;
  if (typeof input !== "string" || !MONEY_PATTERN.test(input)) {
    throw invalidModelOutput();
  }
  return input;
}

function nullableDateOnly(input: unknown): string | null {
  if (input === null) return null;
  if (typeof input !== "string" || !isValidDateOnly(input)) {
    throw invalidModelOutput();
  }
  return input;
}

function nullableTrimmedString(
  input: unknown,
  maxLength: number,
): string | null {
  if (input === null) return null;
  if (typeof input !== "string") throw invalidModelOutput();
  const value = input.trim();
  if (!value || value.length > maxLength) throw invalidModelOutput();
  return value;
}

function nullableEnum<T extends string>(
  input: unknown,
  allowed: Set<T>,
): T | null {
  if (input === null) return null;
  if (typeof input !== "string" || !allowed.has(input as T)) {
    throw invalidModelOutput();
  }
  return input as T;
}

function optionalTrimmedString(
  input: unknown,
  maxLength: number,
  field: string,
): string | undefined {
  if (input === undefined || input === null) return undefined;
  if (typeof input !== "string") {
    throw errors.invalidRequest(`The ${field} must be text.`);
  }
  const value = input.trim();
  if (!value) return undefined;
  if (value.length > maxLength) {
    throw errors.invalidRequest(
      `The ${field} must be ${maxLength.toLocaleString()} characters or fewer.`,
    );
  }
  return value;
}

function requireDateOnly(input: unknown, field: string): string {
  if (typeof input !== "string" || !isValidDateOnly(input)) {
    throw errors.invalidRequest(`The ${field} must use YYYY-MM-DD.`);
  }
  return input;
}

function optionalDateOnly(
  input: unknown,
  field: string,
): string | undefined {
  if (input === undefined || input === null || input === "") return undefined;
  return requireDateOnly(input, field);
}

function isIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function requireString(input: unknown): string {
  if (typeof input !== "string") {
    throw errors.invalidRequest("The extraction request is not valid.");
  }
  return input;
}

function requireRecord(input: unknown): Record<string, unknown> {
  if (!isRecord(input)) throw invalidModelOutput();
  return input;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function assertOnlyKeys(
  input: Record<string, unknown>,
  allowedKeys: readonly string[],
  createError: () => Error,
): void {
  const allowed = new Set(allowedKeys);
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    throw createError();
  }
}

function invalidModelOutput() {
  return errors.providerInvalidResponse();
}
