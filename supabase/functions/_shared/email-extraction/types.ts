export type FinancialItemKind = "trial" | "perk" | "subscription";

export type Recurrence =
  | "none"
  | "monthly"
  | "quarterly"
  | "annual"
  | "custom";

export type ExtractionWarningCode =
  | "missing_deadline"
  | "ambiguous_deadline"
  | "inferred_year"
  | "missing_merchant"
  | "missing_amount"
  | "conflicting_amounts"
  | "unverified_action_url"
  | "unsupported_task"
  | "low_confidence"
  | "unsupported_currency"
  | "multiple_dates"
  | "normalized_relative_date";

export type ExtractionWarningField =
  | "general"
  | "merchantName"
  | "title"
  | "kind"
  | "valueAmount"
  | "chargeAmount"
  | "deadlineDate"
  | "recurrence"
  | "actionUrl";

export interface ExtractionWarning {
  code: ExtractionWarningCode;
  field: ExtractionWarningField;
  message: string;
}

export interface GeneratedFinancialEmailCandidate {
  merchantName: string | null;
  title: string | null;
  kind: FinancialItemKind | null;
  valueAmount: string | null;
  chargeAmount: string | null;
  deadlineDate: string | null;
  recurrence: Recurrence | null;
  actionUrl: string | null;
}

export type GeneratedFinancialEmailExtraction =
  | {
    isActionable: false;
    candidate: null;
    confidence: number;
    warnings: ExtractionWarning[];
  }
  | {
    isActionable: true;
    candidate: GeneratedFinancialEmailCandidate;
    confidence: number;
    warnings: ExtractionWarning[];
  };

export interface NormalizedFinancialEmailCandidate extends
  Omit<
    GeneratedFinancialEmailCandidate,
    "valueAmount" | "chargeAmount"
  > {
  valueCents: number | null;
  chargeAmountCents: number | null;
}

export type FinancialEmailExtraction =
  | {
    isActionable: false;
    candidate: null;
    confidence: number;
    warnings: ExtractionWarning[];
  }
  | {
    isActionable: true;
    candidate: NormalizedFinancialEmailCandidate;
    confidence: number;
    warnings: ExtractionWarning[];
  };

export interface ExtractionContext {
  subject?: string;
  emailSentDate?: string;
  userTimeZone: string;
  referenceDate: string;
}

export interface ParseFinancialEmailRequest extends ExtractionContext {
  emailText: string;
}

export interface FinancialEmailExtractor {
  extract(
    emailText: string,
    context: ExtractionContext,
  ): Promise<GeneratedFinancialEmailExtraction>;
}

export type ParseFinancialEmailSuccess = {
  ok: true;
  extraction: FinancialEmailExtraction;
};

export type ExtractionErrorCode =
  | "authentication"
  | "configuration"
  | "invalid_request"
  | "method_not_allowed"
  | "origin_forbidden"
  | "provider_incomplete"
  | "provider_invalid_response"
  | "provider_refused"
  | "provider_unavailable"
  | "rate_limited"
  | "timeout";

export type ParseFinancialEmailFailure = {
  ok: false;
  error: {
    code: ExtractionErrorCode;
    message: string;
    retryable: boolean;
  };
};

export type ParseFinancialEmailResponse =
  | ParseFinancialEmailSuccess
  | ParseFinancialEmailFailure;
