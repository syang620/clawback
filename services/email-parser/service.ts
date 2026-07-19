import type { SupabaseClient } from '@supabase/supabase-js';

import {
  FinancialEmailClientError,
  type FinancialEmailClientErrorCode,
  type FinancialEmailExtraction,
  type FinancialEmailParser,
  FinancialEmailRequestAbortedError,
  type ParseFinancialEmailInput,
} from '@/features/email-parser/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import { resolveSupabaseEnvironment } from '@/lib/supabase/environment';
import {
  InvalidEmailExtractionEnvelopeError,
  parseFinancialEmailExtractionEnvelope,
  parseFinancialEmailFailureEnvelope,
} from '@/services/email-parser/validation';
import type { Database } from '@/types/database';

const EMAIL_LIMIT = 20_000;
const SUBJECT_LIMIT = 500;
const CLIENT_TIMEOUT_MS = 65_000;

type ServerErrorCode =
  | 'authentication'
  | 'configuration'
  | 'invalid_request'
  | 'method_not_allowed'
  | 'origin_forbidden'
  | 'provider_incomplete'
  | 'provider_invalid_response'
  | 'provider_refused'
  | 'provider_unavailable'
  | 'rate_limited'
  | 'timeout';

const serverErrorMap: Record<
  ServerErrorCode,
  { code: FinancialEmailClientErrorCode; message: string }
> = {
  authentication: {
    code: 'unauthorized',
    message:
      'Your connected session is no longer available. Return to Home and try again.',
  },
  configuration: {
    code: 'configuration_error',
    message: 'Email extraction is not configured correctly.',
  },
  invalid_request: {
    code: 'invalid_input',
    message: 'Review the email text and subject before trying again.',
  },
  method_not_allowed: {
    code: 'unknown_error',
    message: 'Email extraction could not be completed safely. Try again.',
  },
  origin_forbidden: {
    code: 'forbidden_origin',
    message: 'Email extraction is not available from this application origin.',
  },
  provider_incomplete: {
    code: 'incomplete_response',
    message:
      'The extraction was incomplete. Your email is still here, so you can try again.',
  },
  provider_invalid_response: {
    code: 'invalid_model_output',
    message:
      'The extraction result could not be used safely. Try again or add the task manually.',
  },
  provider_refused: {
    code: 'refusal',
    message:
      'This email could not be processed. You can add the task manually.',
  },
  provider_unavailable: {
    code: 'provider_unavailable',
    message:
      'Email extraction is temporarily unavailable. Your email is still here.',
  },
  rate_limited: {
    code: 'rate_limited',
    message:
      'The temporary extraction limit has been reached. Your email is still here.',
  },
  timeout: {
    code: 'provider_timeout',
    message:
      'Email extraction took too long. Your email is still here, so you can try again.',
  },
};

export class SupabaseFinancialEmailParser implements FinancialEmailParser {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async extract(
    input: ParseFinancialEmailInput,
    options: { signal?: AbortSignal } = {},
  ): Promise<FinancialEmailExtraction> {
    const normalizedInput = normalizeRequest(input);
    if (options.signal?.aborted) throw new FinancialEmailRequestAbortedError();

    let result: { data: unknown; error: unknown };
    try {
      result = await this.client.functions.invoke<unknown>(
        'parse-financial-email',
        {
          body: normalizedInput,
          signal: options.signal,
          timeout: CLIENT_TIMEOUT_MS,
        },
      );
    } catch {
      if (options.signal?.aborted) {
        throw new FinancialEmailRequestAbortedError();
      }
      throw clientError('network_error', true);
    }

    if (options.signal?.aborted) throw new FinancialEmailRequestAbortedError();

    if (result.error) {
      const failure = await readFailure(result.error);
      if (!failure) throw clientError('network_error', true);
      throw mapServerError(
        failure.code,
        failure.retryable,
        failure.retryAfterSeconds,
      );
    }

    try {
      return parseFinancialEmailExtractionEnvelope(
        result.data,
        normalizedInput.emailText,
      );
    } catch (error) {
      if (error instanceof InvalidEmailExtractionEnvelopeError) {
        throw clientError('unknown_error', true);
      }
      throw clientError('unknown_error', true);
    }
  }
}

export function createDefaultFinancialEmailParser(): FinancialEmailParser {
  const environment = resolveSupabaseEnvironment();
  if (environment.mode !== 'connected') {
    throw clientError('configuration_error', false);
  }
  return new SupabaseFinancialEmailParser(getSupabaseClient(environment));
}

function normalizeRequest(
  input: ParseFinancialEmailInput,
): ParseFinancialEmailInput {
  const emailText = input.emailText.trim();
  const subject = input.subject?.trim() ?? '';
  if (!emailText || emailText.length > EMAIL_LIMIT) {
    throw clientError('invalid_input', false);
  }
  if (subject.length > SUBJECT_LIMIT) {
    throw clientError('invalid_input', false);
  }
  if (!isDateOnly(input.referenceDate) || !isIanaTimeZone(input.userTimeZone)) {
    throw clientError('configuration_error', false);
  }
  return {
    emailText,
    ...(subject ? { subject } : {}),
    referenceDate: input.referenceDate,
    userTimeZone: input.userTimeZone,
  };
}

async function readFailure(error: unknown): Promise<{
  code: string;
  retryable: boolean;
  retryAfterSeconds?: number;
} | null> {
  if (!error || typeof error !== 'object' || !('context' in error)) return null;
  const context = (error as { context?: unknown }).context;
  if (!isResponseContext(context)) return null;

  let envelope: unknown;
  try {
    envelope = await context.clone().json();
  } catch {
    return null;
  }
  try {
    const failure = parseFinancialEmailFailureEnvelope(envelope);
    return {
      ...failure,
      ...(failure.code === 'rate_limited'
        ? { retryAfterSeconds: readRetryAfter(context.headers) }
        : {}),
    };
  } catch {
    return null;
  }
}

function mapServerError(
  code: string,
  retryable: boolean,
  retryAfterSeconds?: number,
): FinancialEmailClientError {
  const mapping = serverErrorMap[code as ServerErrorCode];
  if (!mapping) return clientError('unknown_error', true);
  return new FinancialEmailClientError(
    mapping.code,
    retryable,
    mapping.message,
    mapping.code === 'rate_limited' ? (retryAfterSeconds ?? 60) : undefined,
  );
}

function clientError(
  code: FinancialEmailClientErrorCode,
  retryable: boolean,
): FinancialEmailClientError {
  const fallbackMessages: Record<FinancialEmailClientErrorCode, string> = {
    invalid_input: 'Review the email text and subject before trying again.',
    unauthorized:
      'Your connected session is no longer available. Return to Home and try again.',
    forbidden_origin:
      'Email extraction is not available from this application origin.',
    rate_limited:
      'The temporary extraction limit has been reached. Your email is still here.',
    provider_timeout:
      'Email extraction took too long. Your email is still here, so you can try again.',
    provider_unavailable:
      'Email extraction is temporarily unavailable. Your email is still here.',
    refusal:
      'This email could not be processed. You can add the task manually.',
    incomplete_response:
      'The extraction was incomplete. Your email is still here, so you can try again.',
    invalid_model_output:
      'The extraction result could not be used safely. Try again or add the task manually.',
    configuration_error: 'Email extraction is not configured correctly.',
    network_error:
      'Clawback could not reach email extraction. Your email is still here.',
    unknown_error: 'Email extraction could not be completed safely. Try again.',
  };
  return new FinancialEmailClientError(code, retryable, fallbackMessages[code]);
}

function readRetryAfter(headers: Headers): number {
  const value = headers.get('Retry-After');
  if (!value || !/^\d+$/.test(value)) return 60;
  const seconds = Number(value);
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : 60;
}

function isResponseContext(
  input: unknown,
): input is { clone(): { json(): Promise<unknown> }; headers: Headers } {
  return (
    !!input &&
    typeof input === 'object' &&
    'clone' in input &&
    typeof (input as { clone?: unknown }).clone === 'function' &&
    'headers' in input &&
    (input as { headers?: unknown }).headers instanceof Headers
  );
}

function isDateOnly(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
