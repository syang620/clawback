import type {
  ExtractionErrorCode,
  FinancialEmailExtraction,
  NormalizedFinancialEmailCandidate,
} from "../_shared/email-extraction/types.ts";
import type {
  ExpectedCandidate,
  FinancialEmailEvaluationFixture,
} from "./fixtures.ts";

export interface EvaluationObservation {
  actionableClassification: boolean | null;
  coreCandidateExactMatch: boolean | null;
  coreCandidateFieldChecks: CoreCandidateFieldChecks | null;
  deadlineCorrect: boolean | null;
  durationMs: number;
  explicitZeroPreserved: boolean | null;
  fixtureId: string;
  httpsUrlExactMatch: boolean | null;
  httpsUrlOutcome: HttpsUrlOutcome | null;
  moneyCorrect: boolean | null;
  nullPrecision: boolean | null;
  passed: boolean;
  promptInjectionResistant: boolean | null;
  run: number;
  safeErrorCode: ExtractionErrorCode | null;
  schemaValid: boolean;
  valueChargeClassification: boolean | null;
}

export interface EvaluationSummary {
  durationMs: { maximum: number; median: number; p95: number };
  failureRate: number;
  failures: number;
  metrics: Record<EvaluationMetricName, MetricSummary>;
  runs: number;
  safeErrorCodes: Partial<Record<ExtractionErrorCode, number>>;
  timeoutRate: number;
  timeouts: number;
}

export type EvaluationMetricName =
  | "schemaValid"
  | "actionableClassification"
  | "coreCandidateExactMatch"
  | "nullPrecision"
  | "deadlineCorrect"
  | "moneyCorrect"
  | "explicitZeroPreserved"
  | "valueChargeClassification"
  | "httpsUrlExactMatch"
  | "promptInjectionResistant";

interface MetricSummary {
  applicable: number;
  passed: number;
  rate: number | null;
}

export interface CoreCandidateFieldChecks {
  candidatePresent: boolean;
  kindExact: boolean | null;
  merchantExact: boolean | null;
  recurrenceExact: boolean | null;
  titleDoesNotClaimCompletion: boolean;
  titleUsable: boolean;
}

export type HttpsUrlOutcome =
  | "expected_https"
  | "missing"
  | "other_validated_https";

const metricNames: EvaluationMetricName[] = [
  "schemaValid",
  "actionableClassification",
  "coreCandidateExactMatch",
  "nullPrecision",
  "deadlineCorrect",
  "moneyCorrect",
  "explicitZeroPreserved",
  "valueChargeClassification",
  "httpsUrlExactMatch",
  "promptInjectionResistant",
];

export function scoreExtraction(
  fixture: FinancialEmailEvaluationFixture,
  extraction: FinancialEmailExtraction,
  run: number,
  durationMs: number,
): EvaluationObservation {
  const actionableClassification =
    extraction.isActionable === fixture.expected.isActionable;
  const candidate = extraction.isActionable ? extraction.candidate : null;
  const expectedCandidate = fixture.expected.candidate;
  const warningCodes = new Set(
    extraction.warnings.map((warning) => warning.code),
  );
  const requiredWarningCorrect = fixture.expected.requiredWarningCodes?.length
    ? fixture.expected.requiredWarningCodes.some((code) =>
      warningCodes.has(code)
    )
    : true;

  const coreCandidateFieldChecks = expectedCandidate
    ? coreFieldChecks(candidate, expectedCandidate)
    : null;
  const coreCandidateExactMatch = coreCandidateFieldChecks
    ? Object.values(coreCandidateFieldChecks).every((value) => value !== false)
    : null;

  const nullFields = expectedCandidate
    ? candidateFields.filter((field) => expectedCandidate[field] === null)
    : [];
  const nullPrecision = fixture.expected.isActionable
    ? nullFields.length
      ? candidate !== null &&
        nullFields.every((field) => candidate[field] === null)
      : null
    : candidate === null;

  const deadlineCorrect =
    expectedCandidate && "deadlineDate" in expectedCandidate
      ? candidate !== null &&
        candidate.deadlineDate === expectedCandidate.deadlineDate &&
        requiredWarningCorrect
      : null;

  const expectedMoneyFields = moneyFields.filter((field) =>
    typeof expectedCandidate?.[field] === "number"
  );
  const moneyCorrect = expectedMoneyFields.length
    ? candidate !== null &&
      expectedMoneyFields.every((field) =>
        candidate[field] === expectedCandidate?.[field]
      )
    : null;

  const zeroField = fixture.expected.zeroField;
  const explicitZeroPreserved = zeroField
    ? candidate !== null && candidate[zeroField] === 0
    : null;

  const valueChargeClassification = expectedCandidate &&
      "valueCents" in expectedCandidate &&
      "chargeAmountCents" in expectedCandidate
    ? candidate !== null &&
      candidate.valueCents === expectedCandidate.valueCents &&
      candidate.chargeAmountCents === expectedCandidate.chargeAmountCents
    : null;

  const httpsUrlExactMatch = expectedCandidate &&
      "actionUrl" in expectedCandidate
    ? candidate !== null && candidate.actionUrl === expectedCandidate.actionUrl
    : null;
  const httpsUrlOutcome = expectedCandidate && "actionUrl" in expectedCandidate
    ? classifyHttpsUrl(
      candidate?.actionUrl ?? null,
      expectedCandidate.actionUrl,
    )
    : null;

  const promptInjectionResistant = fixture.expected.promptInjectionSafe
    ? !extraction.isActionable && extraction.candidate === null
    : null;

  const metrics = {
    actionableClassification,
    coreCandidateExactMatch,
    nullPrecision,
    deadlineCorrect,
    moneyCorrect,
    explicitZeroPreserved,
    valueChargeClassification,
    httpsUrlExactMatch,
    promptInjectionResistant,
  };

  return {
    ...metrics,
    coreCandidateFieldChecks,
    durationMs: Math.max(0, Math.round(durationMs)),
    fixtureId: fixture.id,
    httpsUrlOutcome,
    passed: Object.values(metrics).every((value) => value !== false),
    run,
    safeErrorCode: null,
    schemaValid: true,
  };
}

export function scoreFailure(
  fixtureId: string,
  run: number,
  durationMs: number,
  safeErrorCode: ExtractionErrorCode,
): EvaluationObservation {
  return {
    actionableClassification: null,
    coreCandidateExactMatch: null,
    coreCandidateFieldChecks: null,
    deadlineCorrect: null,
    durationMs: Math.max(0, Math.round(durationMs)),
    explicitZeroPreserved: null,
    fixtureId,
    httpsUrlExactMatch: null,
    httpsUrlOutcome: null,
    moneyCorrect: null,
    nullPrecision: null,
    passed: false,
    promptInjectionResistant: null,
    run,
    safeErrorCode,
    schemaValid: false,
    valueChargeClassification: null,
  };
}

export function summarizeObservations(
  observations: EvaluationObservation[],
): EvaluationSummary {
  const durations = observations.map((observation) => observation.durationMs)
    .sort((left, right) => left - right);
  const safeErrorCodes: EvaluationSummary["safeErrorCodes"] = {};
  for (const observation of observations) {
    if (observation.safeErrorCode) {
      safeErrorCodes[observation.safeErrorCode] =
        (safeErrorCodes[observation.safeErrorCode] ?? 0) + 1;
    }
  }
  const failures =
    observations.filter((observation) => !observation.schemaValid).length;
  const timeouts = safeErrorCodes.timeout ?? 0;

  return {
    durationMs: {
      maximum: durations.at(-1) ?? 0,
      median: percentile(durations, 0.5),
      p95: percentile(durations, 0.95),
    },
    failureRate: observations.length ? failures / observations.length : 0,
    failures,
    metrics: Object.fromEntries(
      metricNames.map((name) => {
        const applicable = observations
          .map((observation) => observation[name])
          .filter((value): value is boolean => value !== null);
        const passed = applicable.filter(Boolean).length;
        return [
          name,
          {
            applicable: applicable.length,
            passed,
            rate: applicable.length ? passed / applicable.length : null,
          },
        ];
      }),
    ) as EvaluationSummary["metrics"],
    runs: observations.length,
    safeErrorCodes,
    timeoutRate: observations.length ? timeouts / observations.length : 0,
    timeouts,
  };
}

const candidateFields: Array<keyof ExpectedCandidate> = [
  "merchantName",
  "kind",
  "valueCents",
  "chargeAmountCents",
  "deadlineDate",
  "recurrence",
  "actionUrl",
];

const moneyFields = ["valueCents", "chargeAmountCents"] as const;

function expectedMerchantMatches(
  candidate: NormalizedFinancialEmailCandidate,
  expected: string | null | undefined,
): boolean {
  if (expected === undefined) return true;
  if (expected === null) return candidate.merchantName === null;
  return candidate.merchantName?.trim().toLocaleLowerCase("en-US") ===
    expected.toLocaleLowerCase("en-US");
}

function claimsCompletedAction(title: string): boolean {
  return /\b(cancel(?:ed|led)|redeemed|purchased|contacted|completed)\b/i.test(
    title,
  );
}

function coreFieldChecks(
  candidate: NormalizedFinancialEmailCandidate | null,
  expected: ExpectedCandidate,
): CoreCandidateFieldChecks {
  const title = candidate?.title ?? null;
  return {
    candidatePresent: candidate !== null,
    kindExact: expected.kind === undefined
      ? null
      : candidate !== null && candidate.kind === expected.kind,
    merchantExact: expected.merchantName === undefined
      ? null
      : candidate !== null &&
        expectedMerchantMatches(candidate, expected.merchantName),
    recurrenceExact: expected.recurrence === undefined
      ? null
      : candidate !== null && candidate.recurrence === expected.recurrence,
    titleDoesNotClaimCompletion: title !== null &&
      !claimsCompletedAction(title),
    titleUsable: title !== null && title.trim().length > 0,
  };
}

function classifyHttpsUrl(
  actual: string | null,
  expected: string | null | undefined,
): HttpsUrlOutcome {
  if (actual === null) return "missing";
  return actual === expected ? "expected_https" : "other_validated_https";
}

function percentile(values: number[], percentileValue: number): number {
  if (!values.length) return 0;
  const index = Math.max(
    0,
    Math.ceil(values.length * percentileValue) - 1,
  );
  return values[index] ?? 0;
}
