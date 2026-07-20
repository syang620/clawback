# Clawback

**Stop leaving money on the table.**

Clawback is a mobile-first financial housekeeping application that helps users track free-trial deadlines, credit-card perks, subscription renewals, and other time-sensitive financial tasks.

GPT-5.6 converts unstructured financial emails into structured tasks. Users review the extracted details, take action, and complete tasks through a satisfying **swipe-to-strike** interaction.

This repository is being developed for OpenAI Build Week 2026.

## Public Demo

The final Netlify production URL will be added after deployment verification.
For a clean judge walkthrough, open the public site in a new private or
incognito browser window. The production build runs in Connected mode and
creates a separate anonymous Supabase session for that browser profile.

Recommended walkthrough:

1. Review the seeded tasks and the Available, At Risk, and Clawed Back metrics.
2. Add a task manually.
3. Paste the synthetic email from `docs/DEMO_GUIDE.md`, run GPT-5.6 extraction,
   review the candidate, and explicitly Save.
4. Refresh to confirm persistence, open the validated external destination,
   Complete the task, review Activity, and Undo.

Clawback tracks what the user needs to do. It does not automatically cancel,
redeem, purchase, or contact a provider. A fresh private window creates a new
anonymous session; records from the prior session remain separate and cannot be
recovered from the new one.

## Product Status

Clawback is currently under active hackathon development.

The planned MVP includes:

- Financial task dashboard
- Trial, perk, and subscription tracking
- Manual task creation
- GPT-5.6 email parsing
- Review-before-save workflow
- Urgency and value ranking
- Swipe-to-strike completion
- Reclaimed-value totals
- iOS and web support

See `docs/PRODUCT.md` for detailed product requirements.

## Technology

- Expo and React Native
- TypeScript
- Expo Router
- NativeWind
- Supabase PostgreSQL and Edge Functions
- OpenAI Responses API with GPT-5.6

## Repository Documentation

- `AGENTS.md` — repository-wide instructions for Codex
- `docs/README.md` — documentation index
- `docs/PRODUCT.md` — product requirements and scope
- `docs/ARCHITECTURE.md` — system design and data flow
- `docs/DESIGN.md` — interface and interaction specification
- `docs/AI_PIPELINE.md` — AI extraction contract and trust boundaries
- `docs/DECISIONS.md` — accepted product and architecture decisions
- `docs/BUILD_LOG.md` — chronological build record
- `docs/MODEL_EVALUATION.md` — synthetic GPT-5.6 and qwen3.5:9b results
- `docs/milestones/` — milestone-specific execution plans

## Getting Started

### Prerequisites

- Node.js 22.13 or newer
- npm
- Full Xcode 26.4 or newer for the iOS Simulator

The existing `.venv/` is ignored and is not required to run the Expo app.

### Install

```bash
npm install
```

The application runs without environment variables in local demo mode. When a
Supabase development project is configured, connected-mode tasks persist across
refreshes and app relaunches.

### Run on web

```bash
npm run web
```

The web build is configured as a single-page application.

Production hosting must rewrite route requests such as `/activity` and
`/item/founderscard-trial`, `/add`, and `/add/manual` to `index.html`. Without
that SPA fallback, refreshing or directly opening an application route may
return the host's 404 response.

The checked-in `netlify.toml` builds with
`npx expo export --platform web`, publishes `dist`, and rewrites unmatched
application routes to `index.html`. Netlify production configuration must set
only `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as client build variables. OpenAI,
service-role, database, JWT, and other private values must never be configured
in Netlify.

### Run on iOS Simulator

```bash
npm run ios
```

If Expo reports that Xcode is not fully installed, install and open Xcode, then
run this command yourself before retrying:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

## Environment Variables

Do not commit real credentials. Copy `.env.example` to `.env.local` only when
using a Supabase development project. Leaving both values unset runs local demo
mode.

The planned client variables are:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

The publishable key is intended for client use, but authorization still depends
on Row Level Security. Never place a service-role key, database password, or
other private secret in an `EXPO_PUBLIC_` variable.

These values are read when Expo creates the application bundle. Restart and
rebundle the app after adding, removing, or changing them. Both values absent
selects local demo mode; partial, malformed, or obviously secret-key
configuration shows a configuration error and never silently falls back.

Connected mode creates or restores a persisted anonymous Supabase session.
There is no account recovery in this milestone: clearing browser storage,
reinstalling the app, or moving to another device can make that anonymous
user's connected data inaccessible.

### Local Supabase checks

Docker is required for the local database checks. Start the stack, rebuild the
database from committed migrations, lint it, and run the RLS tests with:

```bash
npx supabase start
npx supabase db reset
npx supabase db lint --local --fail-on warning
npx supabase test db
```

Regenerate the checked-in database types after a schema change with:

```bash
npx supabase gen types typescript --local > types/database.ts
npx prettier --write types/database.ts
```

Stop the local stack when finished:

```bash
npx supabase stop
```

## Verification

Run the terminating automated checks with:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npx expo export --platform web
```

### Opt-in model evaluation

Live model evaluation is separate from normal tests and builds. It uses only
synthetic fixtures and the same production adapters, prompt, schema, parser,
normalizer, validator, and safe errors as the hosted function.

Set `OPENAI_API_KEY` in the evaluator process without placing it in a repository
file or `EXPO_PUBLIC_` variable, then run GPT-5.6 explicitly:

```bash
EVALUATION_PROVIDER=openai \
OPENAI_EXTRACTION_MODEL=gpt-5.6 \
npm run evaluate:email -- --run-set=initial
```

Local/private Ollama evaluation is also explicit:

```bash
EVALUATION_PROVIDER=ollama \
OLLAMA_BASE_URL=http://127.0.0.1:11434 \
OLLAMA_EXTRACTION_MODEL=qwen3.5:9b \
npm run evaluate:email -- --run-set=initial
```

The evaluator is sequential and never retries automatically. It records only
fixture IDs, normalized observations, durations, aggregate metrics, and safe
failure codes. See `docs/MODEL_EVALUATION.md` for Milestone 05 results.

## Current limitations

- Local demo data, including manually created items, resets when the app reloads
  or relaunches. Connected-mode data persists in Supabase.
- Demo dates are generated and displayed as UTC calendar dates for deterministic
  testing. User-local timezone handling is deferred.
- Manual entry accepts USD amounts with a period decimal separator and uses a
  dependency-free `YYYY-MM-DD` calendar-date field.
- Swipe-to-strike, completion, and Undo are implemented. Physical tactile
  feedback requires a real iPhone and is not verified by the Simulator.
- Anonymous connected sessions have no recovery path after browser storage is
  cleared, the app is reinstalled, or the user moves to another device.
- Broad offline synchronization remains deferred. Connected mode supports
  reviewed GPT-5.6 pasted-email extraction; local demo remains manual-entry
  only.
- GPT-5.6 is the hosted submission provider. qwen3.5:9b is optional local/private
  development support and is not recommended for unattended, hosted,
  judge-facing, or fallback extraction.
- Raw email and raw model output are not persisted. User review and explicit
  Save remain mandatory for every extracted candidate.
- A compressed critical VoiceOver smoke passed for Home, primary navigation,
  one task card, Complete and Undo, required manual fields, and the deadline
  modal. Exhaustive VoiceOver coverage remains deferred. Rate-limit UI behavior
  is accepted through automated testing only.
- The OpenAI project soft-budget setting remains pending and unverified;
  project budgets are alert thresholds, not a hard cap.
- Android-specific implementation and verification have not begun.

## Build Week Evidence

The project will document:

- Where Codex accelerated implementation
- Which decisions were made by the team
- How GPT-5.6 is used at runtime
- Verification and testing results
- The primary Codex `/feedback` Session ID

See `docs/BUILD_LOG.md`.

## License

License selection is pending. Do not assume the repository is open source until a license is added.
