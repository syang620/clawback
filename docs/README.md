# Clawback Documentation

This folder contains the stable product model, technical specification, design rules, AI contract, build decisions, and milestone plans for Clawback.

## How to Use These Documents

Before a milestone begins:

1. Read `../AGENTS.md`.
2. Read the active milestone file.
3. Read only the core documents referenced by that milestone.
4. Inspect the existing code before making changes.
5. Update the milestone completion record and `BUILD_LOG.md` after implementation.

## Core Documents

### `PRODUCT.md`

Defines the problem, audience, value proposition, user journeys, MVP scope, acceptance criteria, edge cases, and non-goals.

### `ARCHITECTURE.md`

Defines the frontend/backend boundaries, data model, service contracts, security model, state strategy, error handling, and deployment approach.

### `DESIGN.md`

Defines the visual character, navigation, screen behavior, card anatomy, urgency presentation, swipe-to-strike interaction, accessibility, and responsive behavior.

### `AI_PIPELINE.md`

Defines how GPT-5.6 parses untrusted email content, the structured output contract, date handling, confidence and evidence rules, failure behavior, and privacy boundaries.

### `DECISIONS.md`

Records accepted product and architecture decisions that should not be revisited silently.

### `BUILD_LOG.md`

Records what Codex built, what the team decided, what was verified, and what remains unresolved.

## Milestones

1. `milestones/01-foundation.md`
2. `milestones/02-core-interactions.md`
3. `milestones/03-manual-entry.md`
4. `milestones/04-supabase.md`
5. `milestones/05-ai-email-parsing.md`
6. `milestones/06-demo-polish.md`
7. `milestones/07-submission.md`

## Documentation Principles

- Product behavior belongs in `PRODUCT.md`.
- Technical boundaries belong in `ARCHITECTURE.md`.
- Visual and interaction rules belong in `DESIGN.md`.
- AI-specific behavior belongs in `AI_PIPELINE.md`.
- Milestone scope belongs in the relevant milestone file.
- Important decisions belong in `DECISIONS.md`.
- Completed work belongs in `BUILD_LOG.md`.
- Implementation truth ultimately lives in working code and tests.
