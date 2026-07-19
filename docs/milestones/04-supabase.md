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

This record covers the implemented and reviewed Checkpoints 4A and 4B.

### Status

Milestone 04 is accepted. Connected web and iOS persistence, environment modes,
database security, live connectivity-failure behavior, and the automated checks
recorded below passed. Checkpoint 4A is accepted and committed as `2061f13`;
Checkpoint 4B is accepted and remains uncommitted for review.

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
- Integrated repository selection and anonymous-session initialization into the
  provider without placing Supabase queries in routes or UI components.
- Added explicit authenticating, seeding, loading, ready, configuration,
  authentication, seed, and read-failure states without flashing an incorrect
  dashboard empty state.
- Added pessimistic manual creation, completion, swipe completion, and Undo with
  provider-owned synchronous duplicate guards, pending UI, safe recoverable
  errors, and stale-response protection.
- Delayed completion haptics and the eight-second Undo timer until persistence
  succeeds. A failed restore leaves the item completed and offers a fresh
  eight-second retry window.
- Replaced the hardcoded sample indicator with truthful, noninteractive `Local
  demo` and `Connected` mode labels.
- Added focused provider, initialization-generation, environment, session-reuse,
  mutation-failure, form-preservation, duplicate-write, and mode-label tests.

### Verification Results

- `npx expo install --check`: passed; dependencies are up to date.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `npm test`: passed, 22 suites and 116 tests.
- `npx expo export --platform web`: passed; production output exported to
  `dist/`.
- `git diff --check`: passed.
- Environment/security scan: passed; `.env` and `.env.local` are ignored,
  `.env.example` remains allowed, and no private credential value exists in
  application source. The literal `sb_secret_` appears only in the validation
  rule that rejects obvious secret keys.
- `npx supabase db reset`: passed against the local CLI/Docker stack; the
  committed migration applied from a clean database. The expected warning that
  no optional `supabase/seed.sql` exists was reported.
- `npx supabase db lint --local --fail-on warning`: passed on the final clean
  database rerun. An earlier run after an image update reported third-party
  `extensions`/pgTAP compatibility findings, but no application-owned `public`
  schema issue; scoped public-schema lint also passed.
- `npx supabase test db`: passed, 37 pgTAP checks.
- Local RLS proof passed with distinct User A and User B identities: each can
  create/read owned rows, User A cannot read/update/delete User B rows, bootstrap
  markers are isolated, and the Postgres `anon` role cannot insert.
- Local bootstrap proof passed: execution is restricted to `authenticated`, a
  non-null `auth.uid()` is required, the function is `SECURITY INVOKER` and
  `VOLATILE`, repeated calls are a no-op, and exactly three noon-UTC demo rows
  are inserted once with FoundersCard earliest.
- Hosted migration confirmation: passed. The linked project and local migration
  lists both contain `20260718000100`, and the linked `public` schema diff was
  empty.
- Hosted anonymous session and RLS verification: passed with two isolated
  `persistSession: false` clients whose distinct user IDs were asserted. User A
  could create/read owned rows; User B could not read, update, or delete User A
  rows. A third publishable-key client with no authenticated session was denied
  read and write access (`42501`).
- Hosted one-time seed behavior: passed. Repeated initialization was a no-op,
  and completing one seed plus deleting another did not reinsert either item.
- Hosted date-only round trip: passed using the canonical 12:00 UTC mapping.
- Expo web export with the ignored `.env.local`: passed without exposing values.
- Database types were generated from the local schema. Regenerate them with
  `npx supabase gen types typescript --local > types/database.ts`, followed by
  `npx prettier --write types/database.ts`.

### Manual Review

#### Connected web — accepted

- Anonymous session restored across refresh: passed.
- Manual item persisted across refresh: passed.
- Amount and calendar date round trip: passed.
- Button completion persisted: passed.
- Activity and metrics persisted: passed.
- Undo persisted after refresh: passed.
- No false empty-state flash: passed.
- Mode indicator displayed `Connected`: passed.

#### Connected iOS — accepted

- Created item persisted across relaunch: passed.
- Swipe completion persisted across relaunch: passed.
- Undo persisted across relaunch: passed.
- No Metro or navigation errors: passed.
- Expo Haptics API completed without a runtime error: passed.
- Physical tactile feedback: not verified without a real iPhone.

#### Failure behavior — accepted

- Failed manual save retained all form values: passed.
- Failed manual save did not navigate: passed.
- Failed manual save did not create a false item: passed.
- Reconnected save created exactly one item: passed.
- Failed completion left the task active: passed.
- Failed completion left metrics unchanged: passed.
- Failed completion created no Activity entry: passed.
- Failed completion did not request haptics: passed.
- Reconnected completion succeeded exactly once: passed.
- Failed Undo kept the item completed: passed.
- Failed Undo retained a retryable action: passed.
- Failed Undo near timer expiry received a fresh retry window: passed.
- Reconnected Undo restored exactly once: passed.
- Restored state persisted after refresh: passed.
- User-facing errors exposed no raw Supabase, Postgres, credential, URL, or
  stack-trace details: passed.
- Connected failures never switched the app to `Local demo`: passed.

#### Environment modes — accepted

- Both variables absent produced `Local demo`: passed.
- Local demo reset after reload as documented: passed.
- Partial configuration produced a configuration error: passed.
- Connected errors never silently fell back to demo mode: passed.

Environment changes required a complete Expo restart/rebundle; no in-app mode
toggle was added.

#### Database verification — accepted where passed

- Public schema lint: passed.
- pgTAP: 37 passed.
- Hosted migration parity: passed.
- Hosted two-user RLS isolation: passed.
- Hosted unauthenticated denial: passed.
- Hosted one-time seeding: passed.
- Hosted UTC date-only round trip: passed.
- Final unscoped lint rerun: passed. An earlier run after an image update
  reported third-party pgTAP extension compatibility findings; no public
  application-schema issue was found in either run.

### Known Limitations

- Anonymous identity recovery after storage clearing, reinstall, or device
  change is out of scope because there is no account-upgrade UI.
- Date-only values use 12:00 UTC as the Milestone 04 deterministic convention.
  User-local timezone conversion remains deferred.
- This checkpoint adds no broad offline synchronization system.
- Physical haptic feedback still requires a real iPhone; the Simulator can only
  prove that the Expo Haptics call runs without a runtime error.

### Commit

Checkpoint 4A was committed and pushed as `2061f13` with message
`chore: add Supabase persistence foundation`. Checkpoint 4B is uncommitted; no
Checkpoint 4B commit, tag, or push was performed.

### Build Log Updated

- [x] `docs/BUILD_LOG.md`
