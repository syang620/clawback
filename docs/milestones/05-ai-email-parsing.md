# Milestone 05 — Pluggable Financial Email Extraction

## Objective

Implement a pasted-email workflow whose hosted/judge extractor is GPT-5.6 and
whose optional local extractor is Ollama. Both providers must produce the same
validated draft for mandatory user review and explicit Save.

## User-Visible Outcome

A connected user can paste a financial email, receive a structured draft,
review and edit every important field, and save a normal financial task. Local
demo mode remains manual-entry only.

## Required Reading

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN.md`
- `docs/AI_PIPELINE.md`
- `docs/DECISIONS.md`
- `docs/milestones/04-supabase.md`

## Provider Decision

Hosted production and judging:

- OpenAI Responses API
- Model `gpt-5.6`
- `store: false`
- `OPENAI_API_KEY` stored only in Edge Function secrets

Optional local development:

- Ollama native chat endpoint
- Default model `qwen3.5:9b`
- `stream: false`
- `think: false`
- Temperature zero
- JSON Schema through `format`

Provider selection occurs only inside the Edge Function. There is no client
model selector and no silent provider fallback.

## Checkpoint 5A — Backend Foundation

### Scope

- Provider-neutral extraction contracts and factory
- OpenAI and Ollama adapters
- Shared strict JSON Schema and trusted instructions
- Runtime parsing and deterministic normalization
- Model decimal strings converted safely to integer cents
- Null versus explicit-zero preservation
- Date-only extraction policy and validation
- Safe URL provenance checks
- Explicit OpenAI refusal/incomplete/content handling
- Supabase Auth bearer-session validation
- Exact CORS origin allowlist
- Atomic database-backed per-user extraction limit
- Safe normalized errors
- Mocked Deno tests and database tests
- Local OpenAI and Ollama Edge Function smoke checks
- Hosted migration and GPT-5.6 function verification
- Architecture, AI pipeline, decision, and build documentation

### Boundaries

- Do not add or change Expo email routes, parser services, or review UI.
- Do not persist raw email or model output.
- Do not include evidence in the MVP extraction protocol.
- Do not use a service-role key.
- Do not deploy Ollama as the hosted judge provider.
- Do not begin Checkpoint 5B until the 5A hard gate is reported.

### Hard Gate

Checkpoint 5A passes only when:

1. Deno format, lint, type-check, and mocked tests pass.
2. Local public-schema lint and pgTAP pass.
3. CORS tests prove allowed unauthenticated `OPTIONS` succeeds.
4. Missing and malformed JWTs are denied.
5. A valid anonymous-user JWT succeeds.
6. The 20-per-user-per-UTC-hour limit is atomic and user-isolated.
7. OpenAI requests always set `store: false` and handle refusal, incomplete,
   missing, empty, unexpected, and unusable output safely.
8. Ollama is reached from the actual local Edge Function through
   `host.docker.internal`.
9. Money, actionable-result, URL, and date invariants pass deterministic tests.
10. Hosted migration parity and an authenticated GPT-5.6 extraction pass.
11. No secret, raw email, raw model response, or service-role key is tracked or
    exported to the client.
12. Local, hosted, and environment-blocked checks are reported separately.

## Checkpoint 5B — Client Workflow and Evaluation

Checkpoint 5B begins only after a separately reported 5A pass.

### Checkpoint 5B-1 — Client and Provenance Foundation

- Resolve the repository-policy conflict by replacing the prior AGENTS rule,
  `"6. Include confidence and evidence information."`, with confidence plus
  bounded warnings and an explicit no-evidence MVP policy.
- Add the typed authenticated Edge Function service, strict runtime response
  validation, stable safe errors, abort semantics, and `Retry-After` support.
- Derive the trusted reference date from Gregorian, Latin-digit
  `formatToParts()` output in the resolved device IANA timezone.
- Restrict public creation to manual/null-confidence or email/validated-
  confidence provenance and prevent updates from changing provenance.
- Deny direct authenticated demo insertion in the database while preserving the
  fixed, transactional one-time bootstrap through a no-argument, locked
  `SECURITY DEFINER` function.
- Verify browser and native origin/auth behavior, local pgTAP, hosted RLS,
  fixed seeding, and no-reseeding before changing routes or review UI.

### Checkpoint 5B-2 — Route, Review, and Save Workflow

Planned scope:

- Connected-only pasted-email entry
- Provider-neutral extraction service
- Loading, retry, and safe error behavior that preserves pasted text
- Mandatory editable review form
- `merchantName` mapping to `FinancialItem.provider` at the application boundary
- Explicit Save with `source: email`
- Persistence failure recovery
- Responsive web and iOS accessibility checks

### Checkpoint 5B-3 — Live Model Evaluation

Required live evaluation models are GPT-5.6 and `qwen3.5:9b`. Run core fixtures
once, then run safety-critical or inconsistent fixtures three times.
`qwen3.5:4b` and `qwen2.5:14b-instruct` are optional if time permits and may not
delay the working hosted flow.

## Milestone Non-Goals

- Gmail OAuth or inbox scanning
- Attachments
- Web browsing for links
- Automatic cancellation or redemption
- Merchant login
- Persisting raw email
- Background queues
- Client-visible model selection
- Milestone 06 work

## Verification Commands

```bash
npx expo install --check
npm run typecheck
npm run lint
npm run format:check
npm test
npx expo export --platform web
git diff --check
deno fmt --check supabase/functions
deno lint --config supabase/functions/deno.json supabase/functions
deno check --config supabase/functions/deno.json \
  supabase/functions/parse-financial-email/index.ts \
  supabase/functions/tests/email-extraction.test.ts
deno test --config supabase/functions/deno.json \
  supabase/functions/tests/email-extraction.test.ts
npx supabase db lint --local --fail-on warning
npx supabase test db
```

Database types regeneration:

```bash
npx supabase gen types typescript --local
```

## Completion Record

### Status

Checkpoint 5A implementation and technical verification complete. Hosted and
local extraction are operational. The owner accepted the default GPT-5.6 rate
limits for the hackathon MVP. The owner-only OpenAI project budget/alert
configuration remains pending and unverified because its control has not yet
been located in the account UI; it does not block this build. Checkpoint 5A is
accepted. Checkpoint 5B-1 is implemented and has passed its hard gate.
Checkpoint 5B-2 route-local workflow and review UI are implemented and have
passed automated verification. The owner accepted Checkpoint 5B-2 for every
check marked passed below. The rate-limit UI result is automated-only, and
VoiceOver labels and reading order remain untested. Checkpoint 5B-3 model
evaluation has not started.

### Checkpoint 5B-2 Automated Gate

- `npx expo install --check`: passed; dependencies are compatible
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format:check`: passed
- `npm test`: passed, 28 suites and 193 tests
- `npx expo export --platform web`: passed; production web output exported
- `git diff --check`: passed
- Deno format, lint, and type-check: passed
- Deno mocked tests: passed, 19 tests
- Local database lint: passed with no schema findings
- Local pgTAP: passed, 62 tests across two files
- Connected Add menu and direct route: covered with mocked route tests
- Local demo menu and direct `/add/email` guidance: covered; the parser service
  is not constructed or invoked
- Input validation and character counts: covered at empty, accepted, and
  exceeded 20,000-character email and 500-character subject boundaries
- Extraction lifecycle: covered for successful review, duplicate prevention,
  no-action result, stale/superseded response rejection, Cancel, blur, unmount,
  and app-background abort behavior
- Safe errors: every normalized client error category is covered without raw
  backend details; rate-limited input remains preserved and retry is disabled
  for the server-provided wait
- Review and persistence: covered for editable fields, null versus explicit
  zero, explicit recurrence, deterministic money/date/HTTPS validation,
  `source: email`, validated confidence, pessimistic Save, failed-write edit
  preservation, and navigation only after commit
- Sensitive-state policy: covered for clearing before navigation and fixed
  route destinations; raw email is never put in URL or provider state
- Accessibility: covered for labels, alerts, character counts, and busy states
- Manual-entry regression: passed after extracting the shared field editor

### Checkpoint 5B-2 Owner Review

Connected web:

- Extract from email visible in Connected mode: passed
- Successful extraction reached editable review: passed
- Explicit Save required before persistence: passed
- Reviewed task persisted after refresh: passed
- Persisted source was `email`: passed
- Ranking, metrics, details, completion, Activity, and Undo: passed

Extraction behavior:

- Missing deadline remained blank and blocked Save: passed
- Explicit zero remained distinct from blank: passed
- No-actionable result created no candidate or item: passed
- Network failure preserved email and subject: passed
- Retry succeeded without duplicate requests: passed
- Rate-limit wait and disabled Retry: passed in automated tests only; hosted
  quota exhaustion was intentionally not repeated

Save failure:

- Review edits survived failed persistence: passed
- Failed Save did not navigate or create a false item: passed
- Retry Save created exactly one item: passed
- Extraction was not rerun: passed

Privacy:

- Raw email absent from URL: passed
- Raw email absent from console and Metro logs: passed
- Raw email absent from browser storage: passed
- Raw email absent from Supabase rows: passed
- Cancel and successful navigation explicitly cleared route draft: passed

Accessibility and layout:

- Keyboard-only web operation: passed
- Focus indicators and announcements: passed
- 200% zoom and responsive layout: passed
- iOS keyboard avoidance and scrolling: passed
- iOS background interruption behavior: passed
- VoiceOver labels and reading order: not tested
- Metro/navigation errors: none observed; passed

Checkpoint 5B-3 live GPT-5.6 and Ollama evaluation is intentionally outside
this checkpoint and has not begun.

### Checkpoint 5B-1 Hard Gate

- `npx expo install --check`: passed
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format:check`: passed
- `npm test`: passed, 25 suites and 164 tests
- `npx expo export --platform web`: passed
- `git diff --check`: passed
- Deno format, lint, and type-check: passed
- Deno mocked tests: passed, 19 tests
- AGENTS evidence conflict: resolved explicitly; the approved no-evidence MVP
  rule is now binding, while bounded warnings and uncalibrated confidence remain
  in the protocol
- Typed client service and strict response parser: passed focused Jest tests for
  success, no-action, actionable invariants, null versus zero, unsafe URL/date/
  money rejection, all normalized server-code mappings, safe unknown/network
  errors, and explicit lifecycle aborts
- Rate limit contract: passed; valid `Retry-After` is retained, malformed or
  absent values safely use 60 seconds, and the service never retries or changes
  providers
- Reference-date derivation: passed year-end, leap-day, DST, UTC-east, and
  UTC-west cases using Gregorian calendar, Latin digits, and IANA timezone
- Public repository provenance: passed; only manual/null-confidence and email/
  validated-confidence creation are exposed, repositories preserve provenance,
  and update mapping cannot change source or confidence
- Local migration reset: passed with migration `20260719000100`
- Local required unscoped database lint and public-schema lint: passed with no
  findings
- Local pgTAP: passed, 62 tests across two files
- Local database provenance: passed; direct demo denied, own manual/email
  allowed, confidence/source pairing enforced, provenance immutable, fixed
  bootstrap works, repeated bootstrap does not reseed, and cross-user RLS
  remains intact
- Hosted migration parity: passed through `20260719000100`
- Hosted public-schema lint: passed with no findings
- Hosted isolated anonymous-user database verification: passed; IDs were
  asserted distinct, demo insertion denied, manual/email allowed, fixed
  bootstrap and no-reseed passed, cross-user read/update/delete returned no
  rows, and unauthenticated read/write were denied
- Hosted browser/native verification: passed; allowed browser origin plus valid
  JWT succeeded, forbidden browser origin returned 403, no-Origin authenticated
  native request succeeded, and no-Origin missing-JWT request returned 401
- Deno CORS unit coverage: passed for exact browser origin and no-Origin native
  headers; authentication remains function-owned after CORS handling
- Database type regeneration command remains
  `npx supabase gen types typescript --local`
- Tracked and exported-source scans: passed; no private key, service-role key,
  database URL, or OpenAI key value was found. Expected safe literals in
  validation code/documentation and the public Supabase URL/publishable key in
  the connected Expo bundle are not private secrets
- No client route, review form, raw-email storage, model selector, Gmail access,
  or Milestone 06 work was added in 5B-1

### Checkpoint 5A Files Changed

- Provider-neutral Edge Function modules, Deno configuration, and mocked tests
- Atomic rate-limit migration, pgTAP tests, and generated database types
- Supabase function configuration and environment example
- Expo/Jest exclusions for the separately checked Deno runtime
- AI pipeline, architecture, decision log, milestone record, and build log

### Checkpoint 5A Verification

- `npx expo install --check`: passed
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format:check`: passed
- `npm test`: passed, 22 suites and 116 tests
- `npx expo export --platform web`: passed
- `git diff --check`: passed
- Deno format, lint, and type-check: passed
- Deno tests: passed, 18 tests
- Local database reset: passed with both migrations applied
- Local public-schema lint: passed with no schema findings
- Required unscoped local lint: passed after a clean local database reset; an
  earlier pre-reset run reported extension-owned pgTAP compatibility findings,
  while application-owned `public` schema lint remained clean throughout
- pgTAP: passed, 52 tests across two files
- Local 25-way concurrent rate claim: passed with 20 allowed and 5 denied
- Local distinct-user isolation, direct-table denial, and unauthenticated claim
  denial: passed
- Local authenticated Ollama Edge invocation: passed through
  `host.docker.internal`; `qwen3.5:9b` returned a validated extraction
- Local authenticated GPT-5.6 Edge invocation: passed; the normalized result
  preserved the calendar date, verified URL, and converted `$123.45` to `12345`
  cents
- Missing and malformed JWT POST requests: denied with safe authentication
  errors
- Mocked refusal, incomplete, empty, unexpected-content, malformed output,
  timeout, configuration, money, date, URL, and actionable-invariant checks:
  passed

### Hosted Verification

- Migration parity: passed; local and remote versions `20260718000100` and
  `20260718000200` match
- Hosted public-schema lint: passed
- Function deployment: passed; `parse-financial-email` version 1 is active with
  gateway JWT verification disabled for function-owned session validation
- Hosted allowed-origin OPTIONS without JWT: passed with HTTP 204, exact origin,
  and `Vary: Origin`
- Hosted POST without JWT and with malformed JWT: passed, both denied with HTTP
  401
- Hosted disallowed-origin POST: passed, denied with HTTP 403
- Hosted valid anonymous-user JWT: passed with a GPT-5.6 extraction
- Hosted GPT-5.6 result: passed; actionable candidate, merchant, `12345` cents,
  exact `2026-07-31` date, and verified HTTPS URL returned
- Hosted 25-way concurrent rate claim: passed with 20 allowed and 5 denied
- Hosted distinct-user IDs, direct-table denial, and unauthenticated claim
  denial: passed
- Required server secret names: configured; values were not printed or tracked
- Owner review accepted the currently visible `gpt-5.6-sol` limits of 10,000
  tokens per minute and 3 requests per minute for the hackathon MVP
- The application database limit remains enabled at 20 extraction requests per
  authenticated user per UTC hour
- OpenAI project $10 monthly soft budget with alerts at 50%, 80%, and 100%:
  pending and not verified; the owner has not yet located the configuration
  control in the account UI

### Known Limitations

- The OpenAI project budget is a soft alert threshold, not a hard spending cap;
  its configuration and alert thresholds remain pending manual owner action and
  must not be represented as verified.
- The Edge Function returns a safe, retryable `rate_limited` error and does not
  persist raw email content. Checkpoint 5B must preserve the user's input when
  presenting this error and allow a safe retry; no client workflow exists yet
  in Checkpoint 5A.
- The local Supabase Kong gateway intercepts browser-style OPTIONS and returns
  its own permissive CORS response before the function. Function-level origin
  enforcement and direct tests pass, and the hosted gateway returned the
  required exact-origin/Vary response.
- Ollama 0.31 could not compile nullable-string `minLength`/`maxLength` keywords
  into its grammar. The shared schema omits those two grammar keywords while the
  provider-independent runtime validator continues to enforce all limits.
- The first Ollama request with separate thinking enabled timed out at 60
  seconds. `think: false` is now explicit; the real Edge invocation completed in
  about 13 seconds.
- Physical client workflow is deferred to Checkpoint 5B.

### Commit

- Included in `feat: add pluggable email extraction backend`

### Build Log Updated

- [x] `docs/BUILD_LOG.md`
