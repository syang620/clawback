# Clawback

**Stop leaving money on the table.**

Clawback is the completed application build for OpenAI Build Week 2026. It
addresses financial housekeeping: the small, scattered deadlines that can turn
into unnecessary charges or lost benefits. It gives users one prioritized place
to track:

- Free-trial cancellation deadlines
- Subscription renewals
- Credit-card perks and expiring benefits

GPT-5.6 can turn pasted financial emails into structured, editable task drafts.
Users decide what to save, take any provider action themselves, and finish tasks
with Clawback's signature **swipe-to-strike** interaction.

## Public Demo

**Try Clawback:**
[https://clawback-app-ai.netlify.app](https://clawback-app-ai.netlify.app)

Open the demo in a fresh private or incognito browser window. The production app
runs in Connected mode, and each private browser session receives a separate
anonymous Supabase identity. Records persist for that identity but are not
available from a different private session.

Clawback does not automatically cancel, redeem, purchase, or contact providers.
It tracks the action and presents a validated external destination; the user
remains responsible for completing the financial action.

### Judge walkthrough

1. Review **Available**, **At Risk**, and **Clawed Back**.
2. Add a task manually or paste the synthetic email.
3. Run GPT-5.6 extraction.
4. Review the editable result and explicitly choose **Save**.
5. Refresh the app to prove persistence.
6. Complete the task, review the updated Activity and total, then **Undo**.

See the [demo guide](docs/DEMO_GUIDE.md) for the synthetic fixture and detailed
walkthrough.

## Implemented Capabilities

- Financial task dashboard
- Trial, perk, and subscription tracking
- Manual task creation
- Shared native/web calendar deadline picker
- GPT-5.6 pasted-email extraction
- Editable review and explicit Save
- Urgency and financial-value ranking
- Consistent treatment of tasks tied on their earliest deadline
- Validated external-action presentation
- Swipe-to-strike and a visible Complete fallback
- Activity history and Clawed Back totals
- Eight-second Undo
- Local demo reset
- Anonymous Connected persistence
- Responsive web and iOS support
- Keyboard and VoiceOver improvements
- Loading, empty, error, and recovery states

Clawback does not access Gmail, edit saved tasks, recover anonymous accounts, or
create recurring tasks automatically. Android-specific validation is not
complete.

## GPT-5.6 Runtime Integration

```text
Pasted email
→ authenticated Supabase Edge Function
→ GPT-5.6 strict structured output
→ deterministic normalization and validation
→ editable review
→ explicit Save
```

OpenAI requests run only in the server-side Supabase Edge Function. Raw email
and raw model output are not persisted, and the model never writes directly to
the database. Every candidate must pass deterministic runtime validation and
then be reviewed by the user; only an explicit Save creates a financial task.

Missing or ambiguous values remain editable or `null`. External URLs are
validated and fail closed. The trusted prompt treats pasted email and any
prompt-injection content inside it as untrusted data, not instructions. The
OpenAI request uses `store: false`.

See the [AI pipeline](docs/AI_PIPELINE.md) for the schema, normalization,
rate-limit, privacy, and failure contracts.

## Built with Codex

Clawback was developed through milestone-gated checkpoints:

```text
repository audit
→ implementation plan
→ owner approval
→ implementation
→ deterministic verification
→ manual acceptance
```

Codex accelerated:

- Repository and architecture audits
- Expo and React Native implementation
- Supabase authentication, Row Level Security, and repository integration
- GPT-5.6 structured extraction
- Deterministic tests
- Model evaluation
- Accessibility and focus management
- Netlify deployment and verification
- Documentation and build records

The owner retained the key product and engineering decisions:

- Pasted email instead of inbox access
- GPT-5.6 as the hosted provider
- Mandatory review before Save
- Pessimistic financial-item mutations
- No automatic financial actions
- Fail-closed URL handling
- Separate Local demo and Connected modes
- Scope discipline and checkpoint acceptance

Codex was the development collaborator; the application's runtime AI calls use
the OpenAI Responses API through the server-side Edge Function.

## Architecture and Stack

- Expo / React Native
- TypeScript
- Expo Router
- NativeWind
- React Native Reanimated
- Supabase Auth
- PostgreSQL
- Row Level Security
- Supabase Edge Functions
- OpenAI Responses API with GPT-5.6
- Netlify
- Jest

The Expo client owns presentation and review state. Supabase owns anonymous
identity, persistence, authorization, and the server-side AI boundary. Shared
domain logic handles ranking, dates, currency, state transitions, normalization,
and validation outside presentation components.

Project documentation:

- [Architecture](docs/ARCHITECTURE.md)
- [AI pipeline](docs/AI_PIPELINE.md)
- [Model evaluation](docs/MODEL_EVALUATION.md)
- [Build log](docs/BUILD_LOG.md)
- [Demo guide](docs/DEMO_GUIDE.md)

## Getting Started

### Prerequisites

- Node.js 22.13 or newer
- npm
- Full Xcode 26.4 or newer for the iOS Simulator

The existing `.venv/` is ignored and is not required to run the Expo app.

### Local demo mode

Install dependencies, leave both Supabase public variables absent, and start
either target:

```bash
npm install
npm run web
```

or:

```bash
npm run ios
```

Local demo mode requires no credentials. It provides seeded and manually
created tasks, completion, Undo, and reset using in-memory data. Hosted GPT-5.6
extraction and durable persistence require Connected mode.

If Expo reports that Xcode is not fully installed, install and open Xcode, then
run this command yourself before retrying iOS:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### Connected mode

Copy `.env.example` to `.env.local` only when using a Supabase development
project, then set both client variables:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

The publishable key is intended for client use, but authorization still depends
on Row Level Security. Never put an OpenAI key, Supabase service-role key, JWT,
database password, or other secret in an `EXPO_PUBLIC_*` variable. Do not commit
real credentials.

Both values absent select Local demo mode. Partial, malformed, or obviously
secret-key configuration fails closed with a configuration error and never
silently falls back. Expo reads these variables while creating the bundle, so
restart and rebundle it after adding, removing, or changing either value.

Connected mode creates or restores a persisted anonymous Supabase session.

### Local Supabase checks

Docker is required for local database checks. Start the stack, rebuild the
database from committed migrations, lint it, and run the Row Level Security
tests with:

```bash
npx supabase start
npx supabase db reset
npx supabase db lint --local --fail-on warning
npx supabase test db
```

After a schema change, regenerate the checked-in database types with:

```bash
npx supabase gen types typescript --local > types/database.ts
npx prettier --write types/database.ts
```

Stop the local stack when finished:

```bash
npx supabase stop
```

### Netlify web deployment

The web build is a single-page application. Production hosting must rewrite
application routes such as `/activity`, `/add`, `/add/manual`, `/add/email`, and
`/item/:id` to `index.html`; otherwise a refresh or direct route may return the
host's 404 response.

The checked-in `netlify.toml` runs `npx expo export --platform web`, publishes
`dist`, and applies the SPA fallback. Netlify production configuration may
receive only `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as client build variables. OpenAI,
service-role, database, JWT, and other private values must remain server-side
and must never be configured in Netlify.

## Testing and Verification

Run the deterministic checks with:

```bash
npx expo install --check
npm run typecheck
npm run lint
npm run format:check
npm test
npx expo export --platform web
```

Final submission evidence:

- 42 Jest suites / 280 tests passed.
- Database/RLS and Edge Function verification passed.
- Six deployed SPA routes returned HTTP 200: `/`, `/activity`, `/add`,
  `/add/manual`, `/add/email`, and a representative `/item/:id` route.
- Source and deployed-bundle secret scans passed.
- The public Connected workflow passed initialization, GPT-5.6 extraction,
  editable review, explicit Save, refresh persistence, Complete, and Undo.

Normal tests and builds do not make live model requests.

## Model Evaluation

The production-path evaluator used 14 synthetic, non-sensitive fixtures for 58
scored runs, plus 8 targeted GPT-5.6 diagnostics. GPT-5.6 remained the hosted
provider, and all 26 scored GPT-5.6 responses were schema-valid. Its actionable
classification, deadline, money, null, explicit-zero, value-versus-charge, and
prompt-injection checks passed.

URL exact-match misses did not weaken the safety boundary: deterministic
validation remained fail-closed, and no unsafe URL survived into a review
candidate. Model confidence is an uncalibrated estimate and is not treated as
accuracy.

qwen3.5:9b was evaluated only as local/private development support. It is not a
hosted provider, automatic fallback, or judge-facing model.

Live evaluation is opt-in and uses the same production adapters, prompt,
schema, parser, normalizer, validator, and safe errors as the hosted function.
Set `OPENAI_API_KEY` only in the evaluator process environment, never in a
repository file or `EXPO_PUBLIC_*` variable, then run:

```bash
EVALUATION_PROVIDER=openai \
OPENAI_EXTRACTION_MODEL=gpt-5.6 \
npm run evaluate:email -- --run-set=initial
```

Optional local/private Ollama evaluation is also explicit:

```bash
EVALUATION_PROVIDER=ollama \
OLLAMA_BASE_URL=http://127.0.0.1:11434 \
OLLAMA_EXTRACTION_MODEL=qwen3.5:9b \
npm run evaluate:email -- --run-set=initial
```

The evaluator is sequential and never retries automatically. It records only
fixture IDs, normalized observations, durations, aggregate metrics, and safe
failure codes. Detailed methodology and results are in the
[model evaluation](docs/MODEL_EVALUATION.md).

## Current Limitations and Next Steps

Manual creation and AI review now use the shared platform calendar deadline
picker: native on iOS and browser-native on web.

- Anonymous sessions have no recovery path after storage is cleared, the app is
  reinstalled, or the user moves to another device.
- Local demo data is in-memory and resets when the app reloads or relaunches.
- Exhaustive VoiceOver coverage remains deferred.
- Android-specific verification is incomplete.
- Broad offline synchronization is not implemented.
- The OpenAI project budget is an alert threshold, not a hard cap.
- Saved-task editing and notifications are future work.

## Repository Status

This repository remains private for Build Week judging unless the owner chooses
otherwise. It does not include an open-source license.
