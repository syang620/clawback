import { createCorsHeaders } from "../_shared/email-extraction/cors.ts";
import { ExtractionError } from "../_shared/email-extraction/errors.ts";
import {
  type EnvironmentReader,
  resolveProviderEnvironment,
  resolveSharedEnvironment,
} from "../_shared/email-extraction/environment.ts";
import { OllamaEmailExtractor } from "../_shared/email-extraction/ollama.ts";
import {
  extractStructuredText,
  OpenAIEmailExtractor,
} from "../_shared/email-extraction/openai.ts";
import { buildExtractionInstructions } from "../_shared/email-extraction/prompt.ts";
import type {
  ExtractionContext,
  GeneratedFinancialEmailExtraction,
} from "../_shared/email-extraction/types.ts";
import {
  decimalAmountToCents,
  isValidDateOnly,
  normalizeExtraction,
  parseFinancialEmailRequest,
  parseGeneratedExtraction,
} from "../_shared/email-extraction/validation.ts";

const context: ExtractionContext = {
  userTimeZone: "America/New_York",
  referenceDate: "2026-07-18",
  emailSentDate: "2026-07-17",
  subject: "Your trial reminder",
};

const generated: GeneratedFinancialEmailExtraction = {
  isActionable: true,
  candidate: {
    merchantName: "Example",
    title: "Cancel Example trial",
    kind: "trial",
    valueAmount: null,
    chargeAmount: "123.45",
    deadlineDate: "2026-07-31",
    recurrence: "none",
    actionUrl: "https://example.com/account",
  },
  confidence: 0.8,
  warnings: [],
};

Deno.test("request validation trims accepted fields and removes empty subject", () => {
  const result = parseFinancialEmailRequest({
    emailText: "  email body  ",
    subject: "   ",
    userTimeZone: "America/New_York",
    referenceDate: "2026-07-18",
  });
  assertEquals(result.emailText, "email body");
  assertEquals(result.subject, undefined);
});

Deno.test("request validation rejects oversized email and sender metadata", () => {
  assertExtractionError(
    () =>
      parseFinancialEmailRequest({
        emailText: "x".repeat(20_001),
        userTimeZone: "UTC",
        referenceDate: "2026-07-18",
      }),
    "invalid_request",
  );
  assertExtractionError(
    () =>
      parseFinancialEmailRequest({
        emailText: "text",
        sender: "removed from the MVP contract",
        userTimeZone: "UTC",
        referenceDate: "2026-07-18",
      }),
    "invalid_request",
  );
});

Deno.test("trusted instructions define deterministic date anchors and no evidence", () => {
  const instructions = buildExtractionInstructions(context);
  assert(instructions.includes("anchor date 2026-07-17"));
  assert(instructions.includes("reference date 2026-07-18"));
  assert(instructions.includes("never shift it through timezone conversion"));
  assert(instructions.includes("Do not include evidence"));
});

Deno.test("date-only validation covers leap days and impossible dates", () => {
  assert(isValidDateOnly("2028-02-29"));
  assert(!isValidDateOnly("2027-02-29"));
  assert(!isValidDateOnly("2026-13-01"));
});

Deno.test("money conversion preserves null and explicit zero", () => {
  assertEquals(decimalAmountToCents(null), null);
  assertEquals(decimalAmountToCents("0"), 0);
  assertEquals(decimalAmountToCents("0.00"), 0);
  assertEquals(decimalAmountToCents("12.5"), 1_250);
  assertEquals(decimalAmountToCents("123.45"), 12_345);
});

Deno.test("money conversion rejects negative, excessive precision, and overflow", () => {
  for (const value of ["-1", "1.234", "1,000.00", "1e2", "999999999999999"]) {
    assertExtractionError(
      () => decimalAmountToCents(value),
      "provider_invalid_response",
    );
  }
});

Deno.test("actionable invariant is enforced after model generation", () => {
  assertExtractionError(
    () =>
      parseGeneratedExtraction({
        isActionable: false,
        candidate: generated.candidate,
        confidence: 0.5,
        warnings: [],
      }),
    "provider_invalid_response",
  );
  assertExtractionError(
    () =>
      parseGeneratedExtraction({
        isActionable: true,
        candidate: null,
        confidence: 0.5,
        warnings: [],
      }),
    "provider_invalid_response",
  );
});

Deno.test("normalization converts model decimals and keeps verified HTTPS URL", () => {
  const normalized = normalizeExtraction(
    generated,
    "Manage at https://example.com/account before July 31.",
  );
  assert(normalized.isActionable);
  assertEquals(normalized.candidate.valueCents, null);
  assertEquals(normalized.candidate.chargeAmountCents, 12_345);
  assertEquals(normalized.candidate.actionUrl, "https://example.com/account");
});

Deno.test("normalization removes invented or unsafe action URL with warning", () => {
  const normalized = normalizeExtraction(generated, "No link is present.");
  assert(normalized.isActionable);
  assertEquals(normalized.candidate.actionUrl, null);
  assert(
    normalized.warnings.some(
      (warning) => warning.code === "unverified_action_url",
    ),
  );
});

Deno.test("environment requires an explicit allowlist and provider", () => {
  assertExtractionError(
    () => resolveSharedEnvironment(reader({})),
    "configuration",
  );
  const shared = resolveSharedEnvironment(
    reader({ AI_EXTRACTION_ALLOWED_ORIGINS: "http://localhost:8081" }),
  );
  assertEquals(shared.timeoutMs, 60_000);
  assertExtractionError(
    () => resolveProviderEnvironment(reader({}), shared.timeoutMs),
    "configuration",
  );
});

Deno.test("environment resolves OpenAI without exposing a fallback provider", () => {
  const result = resolveProviderEnvironment(
    reader({ AI_EXTRACTION_PROVIDER: "openai", OPENAI_API_KEY: "test-key" }),
    60_000,
  );
  assertEquals(result.provider, "openai");
  if (result.provider === "openai") assertEquals(result.model, "gpt-5.6");
  assertExtractionError(
    () =>
      resolveProviderEnvironment(
        reader({ AI_EXTRACTION_PROVIDER: "unsupported" }),
        60_000,
      ),
    "configuration",
  );
});

Deno.test("environment permits local HTTP Ollama and rejects remote HTTP", () => {
  const local = resolveProviderEnvironment(
    reader({
      AI_EXTRACTION_PROVIDER: "ollama",
      OLLAMA_BASE_URL: "http://host.docker.internal:11434",
    }),
    60_000,
  );
  assertEquals(local.provider, "ollama");
  assertExtractionError(
    () =>
      resolveProviderEnvironment(
        reader({
          AI_EXTRACTION_PROVIDER: "ollama",
          OLLAMA_BASE_URL: "http://ollama.example.com",
        }),
        60_000,
      ),
    "configuration",
  );
});

Deno.test("CORS echoes only an allowed origin and varies by Origin", () => {
  const headers = createCorsHeaders("http://localhost:8081", [
    "http://localhost:8081",
  ]);
  assertEquals(
    headers.get("Access-Control-Allow-Origin"),
    "http://localhost:8081",
  );
  assertEquals(headers.get("Vary"), "Origin");
  assertExtractionError(
    () =>
      createCorsHeaders("https://attacker.example", ["https://app.example"]),
    "origin_forbidden",
  );
});

Deno.test("CORS permits authenticated native requests without an Origin header", () => {
  const headers = createCorsHeaders(null, ["https://app.example"]);
  assertEquals(headers.get("Access-Control-Allow-Origin"), null);
  assertEquals(headers.get("Vary"), "Origin");
});

Deno.test("OpenAI request uses Responses structured output and store false", async () => {
  let requestBody: Record<string, unknown> | null = null;
  const extractor = new OpenAIEmailExtractor({
    apiKey: "test-key",
    model: "gpt-5.6",
    timeoutMs: 1_000,
    fetcher: ((_input, init) => {
      requestBody = JSON.parse(readRequestBody(init));
      return Promise.resolve(jsonResponse(openAIResponse(generated)));
    }) as typeof fetch,
  });

  const result = await extractor.extract("email", context);
  const capturedRequest = requestBody as Record<string, unknown> | null;
  assert(result.isActionable);
  assertEquals(capturedRequest?.store, false);
  assertEquals(capturedRequest?.model, "gpt-5.6");
  assert(isRecord(capturedRequest?.text));
});

Deno.test("OpenAI response parser handles refusal and incomplete response", () => {
  assertExtractionError(
    () =>
      extractStructuredText({
        status: "completed",
        error: null,
        output: [
          { type: "message", content: [{ type: "refusal", refusal: "no" }] },
        ],
      }),
    "provider_refused",
  );
  assertExtractionError(
    () =>
      extractStructuredText({
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        output: [],
      }),
    "provider_incomplete",
  );
});

Deno.test("OpenAI response parser rejects missing, empty, and unexpected content", () => {
  const invalidResponses = [
    { status: "completed", error: null, output: [] },
    {
      status: "completed",
      error: null,
      output: [{ type: "message", content: [] }],
    },
    {
      status: "completed",
      error: null,
      output: [{
        type: "message",
        content: [{ type: "output_text", text: "" }],
      }],
    },
    {
      status: "completed",
      error: null,
      output: [{ type: "message", content: [{ type: "tool_call" }] }],
    },
  ];
  for (const response of invalidResponses) {
    assertExtractionError(
      () => extractStructuredText(response),
      "provider_invalid_response",
    );
  }
});

Deno.test("OpenAI abort maps to the normalized timeout error", async () => {
  const extractor = new OpenAIEmailExtractor({
    apiKey: "test-key",
    model: "gpt-5.6",
    timeoutMs: 1,
    fetcher: ((_input, init) =>
      new Promise((_resolve, reject) => {
        readRequestSignal(init)?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")));
      })) as typeof fetch,
  });

  try {
    await extractor.extract("email", context);
  } catch (error) {
    assert(error instanceof ExtractionError);
    assertEquals(error.code, "timeout");
    return;
  }
  throw new Error("Expected timeout error.");
});

Deno.test("Ollama request uses native chat schema, no thinking or streaming, and temperature zero", async () => {
  let requestBody: Record<string, unknown> | null = null;
  const extractor = new OllamaEmailExtractor({
    baseUrl: "http://host.docker.internal:11434",
    model: "qwen3.5:9b",
    timeoutMs: 1_000,
    fetcher: ((_input, init) => {
      requestBody = JSON.parse(readRequestBody(init));
      return Promise.resolve(
        jsonResponse({
          done: true,
          message: { content: JSON.stringify(generated) },
        }),
      );
    }) as typeof fetch,
  });

  await extractor.extract("email", context);
  const capturedRequest = requestBody as Record<string, unknown> | null;
  assertEquals(capturedRequest?.stream, false);
  assertEquals(capturedRequest?.think, false);
  assert(isRecord(capturedRequest?.format));
  assertEquals(
    (capturedRequest?.options as Record<string, unknown>).temperature,
    0,
  );
});

function openAIResponse(value: unknown) {
  return {
    status: "completed",
    error: null,
    incomplete_details: null,
    output: [
      {
        type: "message",
        content: [{ type: "output_text", text: JSON.stringify(value) }],
      },
    ],
  };
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json" },
  });
}

function readRequestBody(input: unknown): string {
  if (!isRecord(input) || !("body" in input)) {
    throw new Error("Expected a request body.");
  }
  return String(input.body);
}

function readRequestSignal(input: unknown): AbortSignal | null {
  if (!isRecord(input) || !("signal" in input)) return null;
  return input.signal instanceof AbortSignal ? input.signal : null;
}

function reader(values: Record<string, string>): EnvironmentReader {
  return { get: (name) => values[name] };
}

function assertExtractionError(
  action: () => unknown,
  code: ExtractionError["code"],
): void {
  try {
    action();
  } catch (error) {
    assert(error instanceof ExtractionError);
    assertEquals(error.code, code);
    return;
  }
  throw new Error(`Expected ExtractionError ${code}.`);
}

function assert(condition: unknown): asserts condition {
  if (!condition) throw new Error("Assertion failed.");
}

function assertEquals(actual: unknown, expected: unknown): void {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${
        JSON.stringify(actual)
      }.`,
    );
  }
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
