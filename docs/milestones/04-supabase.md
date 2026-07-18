# Milestone 04 — Supabase Persistence

## Objective

Persist financial items securely with Supabase while preserving a reliable local demo mode.

## User-Visible Outcome

A user's created and completed tasks persist across application restarts, while judges can still use demo data without credentials.

## Required Reading

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/milestones/03-manual-entry.md`

## In Scope

- Supabase project configuration
- Client setup
- `.env.example`
- Database migration
- `financial_items` table
- Row Level Security
- Authentication strategy selected and documented
- Typed service layer
- List, create, update, complete, and restore operations
- Loading and error states
- Demo-mode preservation
- Database type generation if practical
- Persistence tests or integration verification

## Out of Scope

- GPT-5.6
- Email parsing
- Gmail OAuth
- Production-grade account recovery
- Complex user profiles
- Analytics
- Background sync

## Security Requirements

- No service-role key in client code
- No OpenAI key in client code
- RLS enabled
- Users access only their own data
- `.env` ignored
- Public variables use Expo-compatible names
- Database operations isolated in services

## Acceptance Criteria

1. Database migration creates the required schema.
2. RLS is enabled.
3. Policies limit records to their owner.
4. The client loads persisted tasks.
5. Manual creation persists.
6. Completion and Undo persist.
7. App restart retains state.
8. Errors are displayed without losing user context.
9. Demo mode still works without Supabase credentials.
10. Type-checking, linting, and tests pass.
11. Security decisions are recorded in `DECISIONS.md`.
12. Setup instructions are documented.

## Suggested Implementation Tasks

1. Confirm authentication approach.
2. Add Supabase dependencies.
3. Add environment configuration.
4. Write migration.
5. Add RLS policies.
6. Implement typed client.
7. Implement service layer.
8. Connect hooks and UI.
9. Preserve demo mode.
10. Test persistence and authorization.
11. Update docs.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npx expo export --platform web
supabase db lint
```

Use available Supabase commands based on local tooling.

Manual checks:

1. Create a task and reload.
2. Complete a task and reload.
3. Undo and reload.
4. Confirm one user cannot access another user's data.
5. Launch without credentials and enter demo mode.

## Completion Record

This record covers Checkpoint 4A only. Checkpoint 4B application integration has
not started.

### Status

Checkpoint 4A implemented. The automated application gate and local Supabase
CLI/Docker database gate passed. Hosted anonymous authentication passed after
local configuration, but hosted database/RLS verification remains blocked
because `public.financial_items` is not available through the hosted API.

Milestone 04 is not complete or accepted until Checkpoint 4B is implemented and
its web and iOS persistence checks pass.

### Files Changed

- Added conservative Supabase environment resolution, a singleton typed client,
  persisted Expo SQLite session storage, and a remount-safe native token-refresh
  lifecycle.
- Added anonymous session creation/restoration and normalized authentication
  errors.
- Added a shared asynchronous `FinancialItemsRepository` interface with local
  and Supabase implementations, runtime row mapping, UTC calendar-date mapping,
  conditional status transitions, and normalized repository errors.
- Added the `financial_items` and `financial_item_bootstrap` migration with
  constraints, timestamps, an owner-scoped index, RLS, least-privilege grants,
  and transactional one-time demo seeding.
- Added generated database types and focused environment, mapping, auth,
  lifecycle, local-repository, Supabase-repository, date round-trip, constraint,
  seed, privilege, and RLS tests.
- Updated environment examples, setup/architecture/security decisions, prior
  Milestone 03 commit metadata, and this build record.

### Verification Results

- `npx expo install --check`: passed; dependencies are up to date.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `npm test`: passed, 20 suites and 104 tests.
- `npx expo export --platform web`: passed; 1,296 modules bundled and production
  output exported to `dist/`.
- `git diff --check`: passed.
- Environment/security scan: passed; `.env` and `.env.local` are ignored,
  `.env.example` remains allowed, and no service-role, OpenAI, or database
  password identifier exists in application source.
- `npx supabase db reset`: passed against the local CLI/Docker stack; the
  committed migration applied from a clean database. The expected warning that
  no optional `supabase/seed.sql` exists was reported.
- `npx supabase db lint --local --fail-on warning`: passed with no schema errors.
- `npx supabase test db`: passed, 37 pgTAP checks.
- Local RLS proof passed with distinct User A and User B identities: each can
  create/read owned rows, User A cannot read/update/delete User B rows, bootstrap
  markers are isolated, and the Postgres `anon` role cannot insert.
- Local bootstrap proof passed: execution is restricted to `authenticated`, a
  non-null `auth.uid()` is required, the function is `SECURITY INVOKER` and
  `VOLATILE`, repeated calls are a no-op, and exactly three noon-UTC demo rows
  are inserted once with FoundersCard earliest.
- Hosted publishable-key connection and anonymous sign-in: passed. The resulting
  session was recoverable from the same client without creating a second user.
- Hosted read-only `financial_items` query: blocked with PostgREST code
  `PGRST205`; the table is not currently available in the hosted API schema, so
  the committed migration and hosted RLS checks are not recorded as passed.
- Expo web export with the ignored `.env.local`: passed without exposing values.
- Database types were generated from the local schema. Regenerate them with
  `npx supabase gen types typescript --local > types/database.ts`, followed by
  `npx prettier --write types/database.ts`.

### Manual Review

- No user-interface behavior changed in Checkpoint 4A, so connected-mode web and
  iOS persistence checks are deferred to Checkpoint 4B.
- Credential-free demo mode remains the active application path because the
  provider has intentionally not been integrated yet.

### Known Limitations

- The provider and routes do not use the repositories yet; there are no
  connected-mode loading, mutation, or error states until Checkpoint 4B.
- The committed migration must be applied to the hosted development project
  before hosted-project RLS verification can run.
- Anonymous identity recovery after storage clearing, reinstall, or device
  change is out of scope because there is no account-upgrade UI.
- Date-only values use 12:00 UTC as the Milestone 04 deterministic convention.
  User-local timezone conversion remains deferred.
- This checkpoint adds no broad offline synchronization system.

### Commit

Not created. No commit, tag, or push was performed.

### Build Log Updated

- [x] `docs/BUILD_LOG.md`
