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

To be filled in after implementation.

### Status

Not started

### Files Changed

- Pending

### Verification Results

- Pending

### Manual Review

- Pending

### Known Limitations

- Pending

### Commit

- Pending

### Build Log Updated

- [ ] `docs/BUILD_LOG.md`
