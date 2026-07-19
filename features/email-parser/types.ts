import type { FinancialItemKind, Recurrence } from '@/types/financial-item';

export type ExtractionWarningCode =
  | 'missing_deadline'
  | 'ambiguous_deadline'
  | 'inferred_year'
  | 'missing_merchant'
  | 'missing_amount'
  | 'conflicting_amounts'
  | 'unverified_action_url'
  | 'unsupported_task'
  | 'low_confidence'
  | 'unsupported_currency'
  | 'multiple_dates'
  | 'normalized_relative_date';

export type ExtractionWarningField =
  | 'general'
  | 'merchantName'
  | 'title'
  | 'kind'
  | 'valueAmount'
  | 'chargeAmount'
  | 'deadlineDate'
  | 'recurrence'
  | 'actionUrl';

export interface ExtractionWarning {
  code: ExtractionWarningCode;
  field: ExtractionWarningField;
  message: string;
}

export interface FinancialEmailCandidate {
  merchantName: string | null;
  title: string | null;
  kind: FinancialItemKind | null;
  valueCents: number | null;
  chargeAmountCents: number | null;
  deadlineDate: string | null;
  recurrence: Recurrence | null;
  actionUrl: string | null;
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
      candidate: FinancialEmailCandidate;
      confidence: number;
      warnings: ExtractionWarning[];
    };

export interface ParseFinancialEmailInput {
  emailText: string;
  subject?: string;
  referenceDate: string;
  userTimeZone: string;
}

export interface FinancialEmailParser {
  extract(
    input: ParseFinancialEmailInput,
    options?: { signal?: AbortSignal },
  ): Promise<FinancialEmailExtraction>;
}

export type FinancialEmailClientErrorCode =
  | 'invalid_input'
  | 'unauthorized'
  | 'forbidden_origin'
  | 'rate_limited'
  | 'provider_timeout'
  | 'provider_unavailable'
  | 'refusal'
  | 'incomplete_response'
  | 'invalid_model_output'
  | 'configuration_error'
  | 'network_error'
  | 'unknown_error';

export class FinancialEmailClientError extends Error {
  constructor(
    public readonly code: FinancialEmailClientErrorCode,
    public readonly retryable: boolean,
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'FinancialEmailClientError';
  }
}

export class FinancialEmailRequestAbortedError extends Error {
  constructor() {
    super('The email extraction request was canceled.');
    this.name = 'FinancialEmailRequestAbortedError';
  }
}
