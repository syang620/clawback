# Milestone 02 — Core Task Interactions

## Objective

Implement Clawback's core completion behavior, urgency ranking, and swipe-to-strike experience using local or demo data.

## User-Visible Outcome

A user can identify the most important task, open its details, complete it through swipe or button, see totals update, and undo the action.

## Required Reading

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN.md`
- `docs/milestones/01-foundation.md`

## In Scope

- Deterministic urgency ranking
- Deadline labels
- Pure financial metric calculations
- Task-detail screen
- Swipe-to-strike
- Visible Complete button
- Haptic feedback on supported devices
- Web-safe interaction fallback
- Completion state transition
- Undo behavior
- Completed-task activity view
- Reduced-motion consideration
- Unit tests for business logic

## Out of Scope

- Supabase persistence
- AI parsing
- Manual forms
- Automatic cancellation
- Push notifications

## Acceptance Criteria

1. Active items are sorted deterministically.
2. Deadline labels handle today, tomorrow, future, and expired states.
3. Swipe completion works on supported mobile environments.
4. A visible Complete button performs the same action.
5. Web users can complete tasks without a swipe gesture.
6. Completing an item updates summary totals.
7. The item appears in Activity.
8. Undo restores the item and totals.
9. Haptics do not cause web errors.
10. Reduced-motion behavior remains usable.
11. Ranking, totals, and transitions are unit tested.
12. Existing dashboard behavior remains intact.

## Suggested Implementation Tasks

1. Define urgency and metric functions.
2. Add unit tests before or alongside implementation.
3. Implement task-detail route.
4. Implement status transitions.
5. Implement Complete button.
6. Implement swipe gesture and animation.
7. Add haptics and web fallback.
8. Add Undo notification.
9. Add Activity screen.
10. Verify on iOS and web.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npx expo export --platform web
```

Manual checks:

1. Complete each task type.
2. Confirm correct amount moves into Clawed Back.
3. Undo each task.
4. Try a partial swipe below threshold.
5. Try keyboard completion on web.
6. Test at least one expired task.

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
