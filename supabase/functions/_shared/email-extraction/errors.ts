import type {
  ExtractionErrorCode,
  ParseFinancialEmailFailure,
} from "./types.ts";

interface ExtractionErrorOptions {
  code: ExtractionErrorCode;
  message: string;
  retryable: boolean;
  status: number;
  retryAfterSeconds?: number;
}

export class ExtractionError extends Error {
  readonly code: ExtractionErrorCode;
  readonly retryable: boolean;
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(options: ExtractionErrorOptions) {
    super(options.message);
    this.name = "ExtractionError";
    this.code = options.code;
    this.retryable = options.retryable;
    this.status = options.status;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export function asExtractionError(error: unknown): ExtractionError {
  if (error instanceof ExtractionError) return error;

  return new ExtractionError({
    code: "provider_unavailable",
    message: "Email extraction is temporarily unavailable. Please try again.",
    retryable: true,
    status: 502,
  });
}

export function toFailureResponse(
  error: ExtractionError,
): ParseFinancialEmailFailure {
  return {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
    },
  };
}

export const errors = {
  authentication: () =>
    new ExtractionError({
      code: "authentication",
      message: "A valid connected session is required.",
      retryable: false,
      status: 401,
    }),
  configuration: () =>
    new ExtractionError({
      code: "configuration",
      message: "Email extraction is not configured correctly.",
      retryable: false,
      status: 500,
    }),
  invalidRequest: (message: string) =>
    new ExtractionError({
      code: "invalid_request",
      message,
      retryable: false,
      status: 400,
    }),
  methodNotAllowed: () =>
    new ExtractionError({
      code: "method_not_allowed",
      message: "This request method is not supported.",
      retryable: false,
      status: 405,
    }),
  originForbidden: () =>
    new ExtractionError({
      code: "origin_forbidden",
      message: "This request origin is not allowed.",
      retryable: false,
      status: 403,
    }),
  providerIncomplete: () =>
    new ExtractionError({
      code: "provider_incomplete",
      message: "The extraction could not be completed. Please try again.",
      retryable: true,
      status: 502,
    }),
  providerInvalidResponse: () =>
    new ExtractionError({
      code: "provider_invalid_response",
      message:
        "The extraction result could not be used safely. Please try again.",
      retryable: true,
      status: 502,
    }),
  providerRefused: () =>
    new ExtractionError({
      code: "provider_refused",
      message:
        "This email could not be processed. You can enter the task manually.",
      retryable: false,
      status: 422,
    }),
  providerUnavailable: () =>
    new ExtractionError({
      code: "provider_unavailable",
      message: "Email extraction is temporarily unavailable. Please try again.",
      retryable: true,
      status: 502,
    }),
  rateLimited: (retryAfterSeconds: number) =>
    new ExtractionError({
      code: "rate_limited",
      message: "Too many extraction requests. Please try again later.",
      retryable: true,
      status: 429,
      retryAfterSeconds,
    }),
  timeout: () =>
    new ExtractionError({
      code: "timeout",
      message: "Email extraction took too long. Please try again.",
      retryable: true,
      status: 504,
    }),
};
