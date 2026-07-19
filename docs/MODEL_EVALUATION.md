# Milestone 05 Model Evaluation

## Scope and Production-Path Wiring

Checkpoint 5B-3 evaluated the provider-neutral financial-email extraction
pipeline on 2026-07-19 with 14 synthetic, non-sensitive fixtures. No real email,
raw provider response, model payload, credential, JWT, or private endpoint was
recorded.

Required providers:

- Hosted submission provider: OpenAI Responses API with `gpt-5.6`
- Optional local/private development provider: Ollama with `qwen3.5:9b`

The opt-in runner imports `createFinancialEmailExtractor` from the production
factory, which constructs the production `OpenAIEmailExtractor` or
`OllamaEmailExtractor`. It also imports the production `normalizeExtraction`
and `asExtractionError` functions. The adapters themselves import the shared
trusted instructions, strict JSON Schema, provider response parser, and runtime
validator. The evaluator contains no duplicated prompt, schema, provider fetch,
parser, normalizer, validator, or safe-error mapper.

OpenAI requests therefore retain the production `store: false` setting. Normal
Jest, Deno, database, build, and CI commands do not invoke a live model.
GPT-5.6 ran sequentially with at least 31 seconds between request starts, no
automatic retries, and the API key read only from the evaluator process
environment. Ollama also ran sequentially.

Model confidence is an uncalibrated estimate and is not treated as accuracy.
Every candidate still requires user review and explicit Save.

## Run Counts

| Model | Fixtures | Initial runs | Repeat runs | Evaluation runs |
| --- | ---: | ---: | ---: | ---: |
| GPT-5.6 | 14 | 14 | 12 across 6 fixtures | 26 |
| qwen3.5:9b | 14 | 14 | 18 across 9 fixtures | 32 |
| Total | 14 | 28 | 30 | 58 |

Eight additional targeted GPT-5.6 diagnostic observations were run after the
initial report because the privacy-safe historical observations retained the
composite pass/fail result but not its individual field booleans. These four
fixtures ran twice: `clear-free-trial`, `actionable-missing-deadline`,
`multiple-dates-one-deadline`, and `relative-date-timezone`. The diagnostic is
reported separately and does not alter the original aggregate denominators.
Total live requests across evaluation and clarification were 66.

Optional `qwen3.5:4b` and `qwen2.5:14b-instruct` runs were intentionally skipped
so they could not delay required verification.

## Corrected Metric Definitions

- **Schema-valid result rate:** the production adapter parsed the provider
  response, the shared runtime validator accepted the generated structure, and
  deterministic normalization completed. This is the schema metric.
- **Core candidate exact match:** actionable fixtures only. One observation
  passes only when a candidate is present, its title is non-empty and does not
  claim a completed action, kind matches exactly, merchant matches after trim
  and case normalization, and recurrence matches exactly. It is a composite
  whole-observation exact-match metric, not a schema-required-field metric and
  not independent field accuracy.
- **Null precision:** every field expected to remain null did remain null.
- **HTTPS URL exact match:** the normalized candidate URL exactly equals the
  fixture's expected HTTPS URL or expected null. This measures exactness, not
  whether unsafe URLs bypassed validation.
- Other metrics compare the named normalized field or behavior with the fixture
  expectation. `null` metric values are excluded from denominators.

The earlier label **Required field correctness** was misleading. Its reported
16/26 (61.5%) also counted four expected non-actionable observations whose
correct `candidate: null` result passed the composite. Renaming the metric and
making it actionable-only produces 12/22 (54.5%) for GPT-5.6 and 4/28 (14.3%)
for qwen3.5:9b from the same stored observations.

## Aggregate Results

| Metric | GPT-5.6 | qwen3.5:9b |
| --- | ---: | ---: |
| Schema-valid result rate | 26/26 (100%) | 32/32 (100%) |
| Actionable classification | 26/26 (100%) | 26/32 (81.3%) |
| Core candidate exact match | 12/22 (54.5%) | 4/28 (14.3%) |
| Null precision | 26/26 (100%) | 26/32 (81.3%) |
| Deadline correctness | 22/22 (100%) | 19/28 (67.9%) |
| Money correctness | 22/22 (100%) | 22/28 (78.6%) |
| Explicit-zero preservation | 1/1 (100%) | 3/3 (100%) |
| Value-versus-charge classification | 22/22 (100%) | 22/28 (78.6%) |
| HTTPS URL exact match | 20/22 (90.9%) | 22/28 (78.6%) |
| Prompt-injection resistance | 3/3 (100%) | 3/3 (100%) |
| Timeout/failure rate | 0/26 (0%) | 0/32 (0%) |
| Fully passing observations | 15/26 (57.7%) | 8/32 (25.0%) |

No live run emitted a safe failure code because no request timed out or failed.
Mocked evaluator tests separately verify that unknown failures reduce to the
safe `provider_unavailable` code without raw error details.

## GPT-5.6 Per-Fixture Misses

Every non-100% GPT-5.6 metric is accounted for below.

### Core candidate exact match

The historical composite missed 10 of 22 applicable observations:

| Fixture | Exact-match passes | Historical misses |
| --- | ---: | ---: |
| `clear-free-trial` | 1/3 | 2 |
| `actionable-missing-deadline` | 0/3 | 3 |
| `multiple-dates-one-deadline` | 0/3 | 3 |
| `relative-date-timezone` | 1/3 | 2 |

The targeted safe diagnostic isolated the field behavior without retaining
candidate text. Across its eight observations:

- Candidate presence, title usability, no-completed-action title, kind, and
  merchant passed 8/8.
- Exact recurrence passed 1/8. It was the only failing core subfield in the
  other seven observations.
- The relative-date diagnostic's final observation matched recurrence; the
  other diagnostic observations returned a different normalized recurrence
  than the fixture expected.

Because raw candidates were intentionally not stored, these diagnostics explain
the fixture pattern rather than reconstructing deleted historical model output.

### HTTPS URL exact match

Only `clear-free-trial` missed: its original run 1 and run 2 observations failed
the exact URL comparison, while run 3 passed. The privacy-safe historical
observation did not retain the URL value. The targeted diagnostic produced this
normalized safe result:

```json
{
  "fixtureId": "clear-free-trial",
  "schemaValid": true,
  "actionableClassification": true,
  "httpsUrlExactMatch": false,
  "httpsUrlOutcome": "other_validated_https",
  "safeErrorCode": null
}
```

The second diagnostic observation returned `expected_https`. No URL string,
email body, or provider response is recorded.

`other_validated_https` means the shared deterministic normalizer accepted a
different HTTPS substring that was present in the synthetic fixture, but it did
not exactly equal the fixture's expected full action URL. This is an exactness
miss, not an unsafe-URL survival.

The `http-only-action-url` fixture passed: its normalized action URL was null.
The production normalizer rejects HTTP, malformed, invented, or non-verifiable
URLs and adds a bounded warning. No HTTP or unsafe URL survived into any
validated review candidate. URL handling was fail-closed.

## Latency

| Model | Median | p95 | Maximum | Mean |
| --- | ---: | ---: | ---: | ---: |
| GPT-5.6 evaluation | 2,634 ms | 4,518 ms | 4,987 ms | 2,721 ms |
| qwen3.5:9b evaluation | 20,869 ms | 26,242 ms | 32,678 ms | 20,343 ms |
| GPT-5.6 diagnostic | 2,419 ms | 3,697 ms | 3,697 ms | 2,584 ms |

Latency is evaluator-observed wall time on the development machine and is not a
service-level guarantee.

## qwen3.5:9b Positioning

qwen3.5:9b is local/private development support only. Based on its 81.3%
actionable classification, 67.9% deadline correctness, and 14.3% core candidate
exact-match result, it is not recommended for unattended, hosted, public,
judge-facing, or automatic-fallback extraction. It remains useful for private
experimentation where the same mandatory user review and explicit Save boundary
is preserved.

## Acceptance and Deferred Checks

No Milestone 05 acceptance blocker remains, assuming the URL path is fail-closed;
the deterministic and live evidence above confirms that it is.

The following are nonblocking deferred checks or owner settings:

- VoiceOver labels and reading order remain pending.
- Live exhaustion of the 20-per-user hourly application limit was not repeated;
  rate-limit UI behavior remains accepted through deterministic automated tests.
- The OpenAI project soft-budget setting remains pending and unverified. Project
  budgets are alert thresholds, not hard caps.

GPT-5.6 remains the hosted submission and judge provider. Raw email and raw
model output are not persisted, and review plus explicit Save remain mandatory.
