import { createClient } from "@supabase/supabase-js";

import { createCorsHeaders } from "../_shared/email-extraction/cors.ts";
import {
  asExtractionError,
  errors,
  toFailureResponse,
} from "../_shared/email-extraction/errors.ts";
import {
  resolveProviderEnvironment,
  resolveSharedEnvironment,
} from "../_shared/email-extraction/environment.ts";
import { createFinancialEmailExtractor } from "../_shared/email-extraction/factory.ts";
import type { ParseFinancialEmailResponse } from "../_shared/email-extraction/types.ts";
import {
  extractionContextFromRequest,
  normalizeExtraction,
  parseFinancialEmailRequest,
} from "../_shared/email-extraction/validation.ts";

const environment = { get: (name: string) => Deno.env.get(name) };

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  let corsHeaders = new Headers({ Vary: "Origin" });
  let providerName: "openai" | "ollama" | "unresolved" = "unresolved";

  try {
    const sharedEnvironment = resolveSharedEnvironment(environment);
    corsHeaders = createCorsHeaders(
      request.headers.get("Origin"),
      sharedEnvironment.allowedOrigins,
    );

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== "POST") throw errors.methodNotAllowed();

    const accessToken = readBearerToken(request.headers.get("Authorization"));
    await validateSession(accessToken);

    const providerEnvironment = resolveProviderEnvironment(
      environment,
      sharedEnvironment.timeoutMs,
    );
    providerName = providerEnvironment.provider;
    const extractor = createFinancialEmailExtractor(providerEnvironment);

    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      throw errors.invalidRequest("The extraction request must be valid JSON.");
    }
    const parsedRequest = parseFinancialEmailRequest(requestBody);

    await claimRateLimit(accessToken);

    const generated = await extractor.extract(
      parsedRequest.emailText,
      extractionContextFromRequest(parsedRequest),
    );
    const response: ParseFinancialEmailResponse = {
      ok: true,
      extraction: normalizeExtraction(generated, parsedRequest.emailText),
    };

    logOutcome(requestId, providerName, "success", startedAt);
    return jsonResponse(response, 200, corsHeaders);
  } catch (unknownError) {
    const error = asExtractionError(unknownError);
    logOutcome(requestId, providerName, error.code, startedAt);
    const headers = new Headers(corsHeaders);
    if (error.retryAfterSeconds !== undefined) {
      headers.set("Retry-After", String(error.retryAfterSeconds));
    }
    return jsonResponse(toFailureResponse(error), error.status, headers);
  }
});

function readBearerToken(header: string | null): string {
  const match = header?.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) throw errors.authentication();
  return match[1];
}

async function validateSession(accessToken: string): Promise<void> {
  const client = createAuthenticatedClient(accessToken);
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) throw errors.authentication();
}

async function claimRateLimit(accessToken: string): Promise<void> {
  const client = createAuthenticatedClient(accessToken);
  const { data, error } = await client.rpc(
    "claim_financial_email_extraction_slot",
  );
  if (error || !Array.isArray(data) || data.length !== 1) {
    throw errors.providerUnavailable();
  }

  const claim: unknown = data[0];
  if (!isRecord(claim) || typeof claim.allowed !== "boolean") {
    throw errors.providerUnavailable();
  }
  if (!claim.allowed) {
    const retryAfterSeconds = typeof claim.retry_after_seconds === "number" &&
        Number.isInteger(claim.retry_after_seconds) &&
        claim.retry_after_seconds > 0
      ? claim.retry_after_seconds
      : 60;
    throw errors.rateLimited(retryAfterSeconds);
  }
}

function createAuthenticatedClient(accessToken: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  if (!supabaseUrl || !supabaseAnonKey) throw errors.configuration();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function jsonResponse(
  body: ParseFinancialEmailResponse,
  status: number,
  headers: Headers,
): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  responseHeaders.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
}

function logOutcome(
  requestId: string,
  provider: "openai" | "ollama" | "unresolved",
  outcome: string,
  startedAt: number,
): void {
  console.info(
    JSON.stringify({
      event: "financial_email_extraction",
      requestId,
      provider,
      outcome,
      durationMs: Math.round(performance.now() - startedAt),
    }),
  );
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
