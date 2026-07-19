# Clawback Decision Log

This file records accepted product and architecture decisions.

Do not silently reverse a decision. Add a new entry that supersedes the old one and explains why.

## ADR-001 — Expo for Mobile and Web

**Status:** Accepted

**Decision:** Use one Expo codebase targeting iOS and web.

**Reason:** The mobile interaction is central to the product, while judges need a low-friction web testing path.

**Consequences:**

- Core functionality must work on both platforms.
- Mobile-only enhancements must degrade gracefully.
- Dependencies must be checked for Expo and web compatibility.

## ADR-002 — Codex as Primary Development Agent

**Status:** Accepted

**Decision:** Use Codex as the primary coding agent for major milestones.

**Reason:** The hackathon evaluates meaningful Codex usage and requires a representative `/feedback` Session ID.

**Consequences:**

- Major implementation should remain in a coherent Codex thread where practical.
- Cursor or other editors may be used for review and minor changes.
- `BUILD_LOG.md` should record important Codex contributions.

## ADR-003 — Bounded Autonomy by Milestone

**Status:** Accepted

**Decision:** Codex may implement one milestone autonomously after presenting a plan, but must stop before beginning the next milestone.

**Reason:** A single end-to-end autonomous build creates excessive product and integration risk. Line-by-line micromanagement wastes Codex's strengths.

**Consequences:**

- Each milestone has explicit scope, non-goals, acceptance criteria, and verification.
- The team manually reviews user-visible results between milestones.
- Stable milestones receive Git commits.

## ADR-004 — Pasted Email Before Gmail Integration

**Status:** Accepted

**Decision:** The MVP accepts pasted email text instead of requiring Gmail OAuth.

**Reason:** Pasted text proves the core GPT-5.6 value with less integration and privacy risk.

**Consequences:**

- Gmail integration is a future opportunity.
- Demo reliability improves.
- The AI pipeline can be tested with curated fixtures.

## ADR-005 — Review Before Save

**Status:** Accepted

**Decision:** AI output is always shown in an editable review screen before creating a task.

**Reason:** Financial dates, amounts, and links require user control and transparency.

**Consequences:**

- The model does not write directly to the database.
- The UI must support uncertainty and missing fields.
- AI-created tasks are drafts until confirmed.

## ADR-006 — No Automatic Cancellation

**Status:** Accepted

**Decision:** Clawback does not automatically cancel subscriptions in the MVP.

**Reason:** Reliable cancellation requires merchant-specific authentication and verification. Claiming automation without dependable execution would reduce trust.

**Consequences:**

- Clawback may open an action URL.
- The user confirms completion manually.
- Product language must not claim that Clawback canceled a service.

## ADR-007 — Supabase for Persistence and Edge Functions

**Status:** Accepted

**Decision:** Use Supabase PostgreSQL, Authentication, Row Level Security, and Edge Functions.

**Reason:** Supabase provides the required backend capabilities with limited infrastructure overhead.

**Consequences:**

- Database changes must be migrations.
- RLS is mandatory.
- The OpenAI key remains server-side.
- The service layer isolates client code from raw queries.

## ADR-008 — Integer Currency

**Status:** Accepted

**Decision:** Store and calculate monetary amounts as integer cents.

**Reason:** Floating-point arithmetic is inappropriate for financial values.

**Consequences:**

- Formatting happens at the presentation layer.
- Types and tests must preserve integer behavior.
- Null and zero must remain distinct.

## ADR-009 — Demo Mode as a First-Class Feature

**Status:** Accepted

**Decision:** Maintain a local demo-data path that does not require external credentials.

**Reason:** Judges must be able to understand and test the product even when backend services fail or are not configured.

**Consequences:**

- Demo data uses the same domain types and business logic.
- Demo mode can complete and restore tasks locally.
- The UI should identify sample data.

## ADR-010 — Lightweight State Management

**Status:** Accepted

**Decision:** Start with React state, custom hooks, and limited context.

**Reason:** The MVP does not justify a broad state-management dependency.

**Consequences:**

- Add a state library only after a documented need.
- Server and UI state remain conceptually separated.

## ADR-011 — Separate Product, Architecture, Design, and AI Documents

**Status:** Accepted

**Decision:** Keep stable project guidance in focused documents and use milestone files for execution scope.

**Reason:** A single large `AGENTS.md` becomes hard to maintain and consumes context unnecessarily.

**Consequences:**

- `AGENTS.md` acts as repository policy and navigation.
- Core documents define stable decisions.
- Milestones define bounded implementation work.

## ADR-012 — Anonymous Authentication for Connected Mode

**Status:** Accepted

**Decision:** Use persisted Supabase anonymous authentication for connected
mode. Continue to use credential-free local demo mode when Supabase is not
configured.

**Reason:** Anonymous authentication gives every connected installation a
unique user ID for durable, RLS-protected data without adding account UI to the
hackathon MVP.

**Consequences:**

- Connected rows are owned by the anonymous Auth user ID.
- RLS policies apply only to the `authenticated` role and compare `auth.uid()`
  with `user_id`.
- Clearing browser storage, reinstalling the application, or changing devices
  can make an anonymous user's previous data inaccessible.
- Email/password, OAuth, profiles, and account upgrades remain out of scope.
- Connected-mode failures are shown to the user and never silently switch the
  application into demo mode.

## ADR-013 — Pluggable Server-Side Email Extraction

**Status:** Accepted

**Decision:** Use a provider-neutral financial email extractor inside the
Supabase Edge Function. Hosted production and judging use the OpenAI Responses
API with `gpt-5.6`. Optional local development may use Ollama, initially with
`qwen3.5:9b`.

**Reason:** GPT-5.6 is a meaningful, judge-ready part of the Build Week
submission. A local Ollama adapter also supports private experimentation and
provider comparison without coupling the Expo application to a model vendor.

**Consequences:**

- Provider selection is server-only and never appears in the client request or
  review UI.
- OpenAI requests set `store: false`; the API key remains an Edge Function
  secret.
- Ollama is local-only and is not exposed as an unauthenticated public service.
- Both providers use the same trusted instructions, JSON Schema, runtime
  validation, deterministic money/date normalization, and safe errors.
- Models return decimal money strings; trusted code converts them to integer
  cents.
- Evidence is omitted from the MVP, and raw email/model output is neither
  logged nor persisted.
- Every result requires user review and explicit Save. Models never write
  financial items or perform financial actions.
- A database-backed per-user limit controls extraction abuse and cost.
- Local demo mode remains manual-entry only.
