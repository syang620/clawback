# Clawback Financial Email-Extraction Pipeline

## 1. Purpose and Provider Strategy

The pipeline converts pasted financial email text into a draft financial item.
It reduces manual entry; it never performs a financial action and never writes
a task without explicit user review and Save.

Hosted production and judging use:

- Provider: OpenAI
- Model: `gpt-5.6`
- API: OpenAI Responses API
- Retention request: `store: false`

Optional local development may use:

- Provider: Ollama
- Default model: `qwen3.5:9b`
- API: Ollama native `/api/chat`
- Host route from local Supabase: `http://host.docker.internal:11434`

Provider selection occurs only inside the Supabase Edge Function. The Expo
request, normalized response, review UI, and persistence path do not select or
identify the AI provider. Local demo mode remains manual-entry only.

## 2. Trust and Privacy Boundary

Email text is untrusted data. The trusted server instruction tells every model
to ignore instructions inside the email, including requests to reveal secrets,
change the schema, claim completion, call tools, or invent information.

The Edge Function owns:

- Authentication and CORS
- Input limits
- Per-user rate limiting
- Provider configuration
- Trusted instructions and JSON Schema
- Runtime parsing and deterministic normalization
- Safe error mapping

Raw email and raw model output are never logged or persisted. Evidence snippets
are omitted from the MVP. The database stores only a user-confirmed financial
item and its minimal source/confidence metadata.

## 3. Input Contract

```ts
export interface ParseFinancialEmailRequest {
  emailText: string;
  subject?: string;
  emailSentDate?: string;
  userTimeZone: string;
  referenceDate: string;
}
```

Rules:

- `emailText` is trimmed, required, and limited to 20,000 characters.
- `subject` is optional and limited to 500 characters.
- A separate sender field is not part of the MVP contract.
- `emailSentDate` and `referenceDate` use `YYYY-MM-DD`.
- `userTimeZone` must be a valid IANA timezone.
- Unknown request fields are rejected.
- Invalid input is rejected before rate-limit capacity is consumed.

## 4. Generated Model Contract

The model returns decimal money strings. It does not calculate integer cents.

```ts
type GeneratedFinancialEmailExtraction =
  | {
      isActionable: false;
      candidate: null;
      confidence: number;
      warnings: ExtractionWarning[];
    }
  | {
      isActionable: true;
      candidate: {
        merchantName: string | null;
        title: string | null;
        kind: "trial" | "perk" | "subscription" | null;
        valueAmount: string | null;
        chargeAmount: string | null;
        deadlineDate: string | null;
        recurrence:
          | "none"
          | "monthly"
          | "quarterly"
          | "annual"
          | "custom"
          | null;
        actionUrl: string | null;
      };
      confidence: number;
      warnings: ExtractionWarning[];
    };
```

`merchantName` is the merchant, issuer, or service. It is intentionally not
named `provider`, which is reserved in this pipeline for the AI provider.

The server enforces the actionable invariant after generation:

- `isActionable: false` requires `candidate: null`.
- `isActionable: true` requires a candidate object, although individual fields
  may be `null` and require user edits.

`needsReview` is not model output. Mandatory review is trusted application
policy and cannot be disabled by a model response.

## 5. Money Normalization

`valueAmount` represents redeemable perk value. `chargeAmount` represents a
potential trial or subscription charge.

The generated values are USD decimal strings without symbols, commas, signs,
or exponents. Examples:

- `null` means no supported amount.
- `"0"` and `"0.00"` mean explicit zero.
- `"7.00"` becomes `700` cents.
- `"14.99"` becomes `1499` cents.

After generation, one deterministic parser converts accepted strings to safe
integer cents. It rejects negative values, more than two decimal places,
non-USD ambiguity, malformed input, overflow, and floating-point rounding.
Null and explicit zero remain distinct.

## 6. Deterministic Date Policy

The extraction candidate uses `deadlineDate: YYYY-MM-DD | null`. Timezone
conversion never shifts an explicitly stated calendar date.

Rules:

1. Preserve an explicit year, month, and day exactly.
2. Resolve relative dates from trusted `emailSentDate` when supplied; otherwise
   use `referenceDate`.
3. Perform relative arithmetic as calendar arithmetic in `userTimeZone`, not as
   elapsed milliseconds.
4. Resolve a missing year to the nearest matching date on or after the anchor
   and add `inferred_year`.
5. Handle leap days and month, quarter, and year boundaries explicitly.
6. Select a date only when it is clearly connected to the cancellation,
   redemption, renewal, or charge deadline.
7. Return `null` with a warning for materially competing or ambiguous dates.
8. A send date found only in untrusted email content may support interpretation
   but does not replace the trusted context anchor.

The reviewed date later enters the existing canonical UTC-noon persistence
conversion. User-local timestamp design remains deferred.

## 7. Warnings and Confidence

Warnings are bounded, machine-readable, user-presentable field notices. They
cover missing deadlines or merchants, ambiguity, inferred years, conflicting
amounts, unsupported currencies, unverifiable URLs, and unsupported tasks.

Confidence is an uncalibrated model estimate from 0 to 1. It is not a
probability of correctness. It never bypasses review, triggers automatic save,
or authorizes an action. Warnings and editable fields are more important than
the numeric estimate.

## 8. URL Policy

An action URL is returned only when the exact HTTPS string appears in the
provided email text. The deterministic normalizer removes malformed, non-HTTPS,
or unverified URLs and adds `unverified_action_url`. The model never browses for
or invents a merchant URL.

## 9. Provider-Neutral Interface

```ts
interface FinancialEmailExtractor {
  extract(
    emailText: string,
    context: ExtractionContext,
  ): Promise<GeneratedFinancialEmailExtraction>;
}
```

`OpenAIEmailExtractor` and `OllamaEmailExtractor` implement this interface.
Each independently parses its provider response, then uses the same runtime
validator and deterministic normalizer.

### OpenAI

- Calls `POST /v1/responses`.
- Uses model `gpt-5.6` in hosted/judge mode.
- Sets `store: false` on every request.
- Supplies the strict schema through `text.format`.
- Handles refusal, incomplete status, missing output, empty text, unexpected
  content, malformed JSON, and unusable successful responses explicitly.

### Ollama

- Calls `/api/chat` with `stream: false`.
- Disables separate reasoning output with `think: false`.
- Uses `options.temperature: 0`.
- Supplies the same JSON Schema through `format`.
- Defaults to `qwen3.5:9b`.
- Uses a request timeout and the same post-generation validation.

Ollama is local/private development support. It is not exposed as an
unauthenticated public endpoint and is not the judge provider.

## 10. Authentication and CORS

The function gateway uses `verify_jwt = false` only so browser preflight can be
handled before authentication. The function:

1. Validates the request origin against `AI_EXTRACTION_ALLOWED_ORIGINS`.
2. Returns an allowed `OPTIONS` response without requiring a JWT.
3. Requires a bearer token for `POST`.
4. Calls Supabase Auth `getUser()` with that token; it never trusts decoded
   claims alone.
5. Uses a publishable/anon key, never a service-role key.

CORS echoes only an exact configured origin, returns `Vary: Origin`, and never
uses a wildcard. Native requests without an Origin still require an
authenticated session.

## 11. Rate and Cost Controls

Each authenticated user may claim 20 provider invocations per UTC hour. The
claim is an atomic PostgreSQL function backed by an RLS-enabled table with no
direct client privileges. The function obtains `auth.uid()` itself and exposes
no user ID or configurable-limit parameter.

Invalid input and failed authentication do not consume capacity. Provider
failures and timeouts do consume a claimed slot because they incurred work.
Exhaustion returns HTTP 429, `rate_limited`, and `Retry-After`.

The OpenAI project uses a $10 monthly soft budget with alerts at 50%, 80%, and
100%. OpenAI budgets are monitoring thresholds rather than hard stops, so the
database rate limit remains the application-enforced control.

## 12. Server-Only Configuration

```text
AI_EXTRACTION_PROVIDER=openai | ollama
AI_EXTRACTION_ALLOWED_ORIGINS=comma-separated exact origins
AI_EXTRACTION_TIMEOUT_MS=60000
OPENAI_API_KEY=server secret
OPENAI_EXTRACTION_MODEL=gpt-5.6
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_EXTRACTION_MODEL=qwen3.5:9b
```

No AI variable uses `EXPO_PUBLIC_`. Missing, partial, unknown, or unsafe
configuration returns a safe configuration error. The server never silently
switches providers.

## 13. Safe Errors

The response exposes only a stable code, user-safe message, and retryability.
Supported codes include:

- `authentication`
- `configuration`
- `invalid_request`
- `origin_forbidden`
- `rate_limited`
- `provider_refused`
- `provider_incomplete`
- `provider_invalid_response`
- `provider_unavailable`
- `timeout`

Raw OpenAI, Ollama, Supabase, credential, URL, stack, email, and model-response
details never reach the client.

## 14. Evaluation

Normal Jest and Deno tests use mocks only. Live evaluations are recorded
separately and never run from the normal test command.

Required models:

1. `gpt-5.6`
2. `qwen3.5:9b`

Optional when time permits:

3. `qwen3.5:4b`
4. `qwen2.5:14b-instruct`

Run all core fixtures once first. Repeat safety-critical or inconsistent
fixtures three times. Compare schema validity, actionable classification,
field correctness, null precision, deadlines, money, value-versus-charge
classification, prompt-injection resistance, latency, and timeout/failure
rate. Benchmarking must not delay the working hosted GPT-5.6 workflow.

## 15. Non-Goals

The MVP does not scan inboxes, parse attachments, browse for links, persist raw
emails, select models in the client, automatically save tasks, cancel services,
redeem benefits, provide financial advice, or build a general quota platform.
