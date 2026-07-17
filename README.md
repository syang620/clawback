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

Create and activate the project-local Python virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
python --version
```

Use `deactivate` when you are finished. The virtual environment is reserved for
Python-based project tooling and is not committed to Git.

The Expo application uses Node.js and npm separately. Detailed application
commands will be finalized during Milestone 01. The expected workflow is:

```bash
npm install
npx expo start
```

Then choose:

- `i` for iOS Simulator
- `w` for web

## Environment Variables

Do not commit real secrets.

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

The project should maintain scripts for:

```bash
npm run typecheck
npm run lint
npm test
```

The exact setup will be completed during Milestone 01.

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
