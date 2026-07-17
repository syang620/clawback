# Clawback

**Stop leaving money on the table.**

Clawback is a mobile-first financial housekeeping application that helps users track free-trial deadlines, credit-card perks, subscription renewals, and other time-sensitive financial tasks.

GPT-5.6 converts unstructured financial emails into structured tasks. Users review the extracted details, take action, and complete tasks through a satisfying **swipe-to-strike** interaction.

This repository is being developed for OpenAI Build Week 2026.

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

Milestone 01 uses local sample data and does not require environment variables.

### Run on web

```bash
npm run web
```

The web build is configured as a single-page application.

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

Do not commit real secrets. Milestone 01 does not read any of these variables.

The planned client variables are:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

The OpenAI key belongs only in the Supabase Edge Function environment:

```text
OPENAI_API_KEY=
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

## Milestone 01 limitations

- Data is local sample data and resets when the app reloads.
- Demo dates are generated and displayed as UTC calendar dates for deterministic
  testing. User-local timezone handling is deferred.
- Add flows, Activity, task details, completion, swipe-to-strike, haptics, Undo,
  Supabase, and GPT-5.6 parsing belong to later milestones.
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
