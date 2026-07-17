# Milestone 03 — Manual Financial Item Creation

## Objective

Allow users to create useful trial, perk, and subscription tasks without AI.

## User-Visible Outcome

A user can create a financial task, validate the details, save it, and see it appear in the dashboard ranking.

## Required Reading

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN.md`
- `docs/milestones/02-core-interactions.md`

## In Scope

- Add menu
- Manual-entry form
- Task-type selection
- Provider and title
- Deadline selection
- Value available
- Charge at risk
- Recurrence
- Action URL
- Notes if low-cost
- Client-side validation
- Error messages
- Local in-memory or demo persistence
- Editing before save
- Tests for validation

## Out of Scope

- Supabase persistence
- Authentication
- GPT-5.6
- Gmail integration
- Merchant lookup
- Notification scheduling

## Form Rules

Minimum required fields:

- Title
- Type
- Deadline

Money fields:

- Perks generally use Value Available.
- Trials and subscriptions generally use Charge at Risk.
- Both fields may be supported when justified.
- Store integer cents.

Action URL:

- Optional
- Must be validated
- Prefer HTTPS

## Acceptance Criteria

1. A user can select trial, perk, or subscription.
2. Required fields are clearly marked.
3. Invalid forms do not save.
4. Error messages preserve entered data.
5. Money values are converted safely to integer cents.
6. Invalid URLs are rejected or omitted.
7. A saved task appears on the dashboard.
8. Dashboard totals and ranking update.
9. The user can cancel the form without creating a task.
10. Web and iOS layouts remain usable.
11. Validation logic is tested.

## Suggested Implementation Tasks

1. Define input and validation schemas.
2. Implement Add menu.
3. Implement shared form controls.
4. Implement type-specific guidance.
5. Convert currency input to cents.
6. Validate deadline and URL.
7. Save into the local item store.
8. Navigate to the created task or dashboard.
9. Add validation tests.
10. Verify both platforms.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npx expo export --platform web
```

Manual checks:

1. Create one item of each type.
2. Submit an empty form.
3. Enter invalid money values.
4. Enter an invalid URL.
5. Cancel midway and confirm no item is added.
6. Confirm totals and ordering update.

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
