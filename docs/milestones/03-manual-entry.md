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

Accepted after automated verification plus manual web and iOS Simulator review.

### Files Changed

- Home Add navigation plus `/add` and `/add/manual` routes
- Trial, perk, and subscription choice menu
- Controlled, accessible manual-entry form with type-specific money guidance
- Pure calendar-date, dollar-input, URL, and form validation
- Typed manual-item creation contract and atomic in-memory provider insertion
- Focused logic, component, provider, metrics, and ranking tests
- README capability, SPA fallback, and current-limitation updates

### Verification Results

- `npx expo install --check` passed using Expo's offline dependency map; Expo
  warned that offline dependency validation is less reliable.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run format:check` passed.
- `npm test` passed: 14 suites and 79 tests.
- `npx expo export --platform web` passed and produced the SPA in `dist/`.
- Development-server checks returned HTTP 200 for `/`, `/add`, a valid
  `/add/manual?kind=perk` route, and an invalid-kind manual route.
- A temporary standard-library SPA fallback server returned the same exported
  `index.html` document with HTTP 200 for all four routes. No permanent server
  or dependency was added.
- The iOS app bundled 1,784 modules and rendered the perk-entry form in Expo Go
  on an iPhone 17 Pro Simulator without Metro or navigation errors.
- The form screenshot confirmed visible Home, Activity, and Add navigation;
  selected task type; required/optional labels; disclaimer; deadline guidance;
  and mobile-width form fields.
- Expo and web export repeated the existing `NO_COLOR`/`FORCE_COLOR` warning.

### Manual Review

Task-type switching behavior:

- Trial and Subscription prioritize Charge at Risk, while Perk prioritizes Value
  Available: passed

Web:

- Created trial, perk, and subscription: passed
- Dashboard metrics update: passed
- Existing ranking applies to new items: passed
- New-item completion and Undo: passed
- Blank versus explicit zero: passed
- Currency validation: passed
- Calendar validation and date stability: passed
- Required-field validation preserves values: passed
- HTTPS URL validation: passed
- Cancel creates nothing: passed
- Keyboard navigation and focus: passed
- Error announcements: passed
- 200% zoom and responsive layout: passed
- Browser console: passed
- Refresh resets manually created data as documented: passed

iOS Simulator:

- Created all three task types: passed
- Keyboard avoidance and scrolling: passed
- Date input behavior: passed
- Validation preserves input: passed
- Cancel and Save navigation: passed
- VoiceOver labels and reading order: passed
- Metro and navigation errors: none observed

### Known Limitations

- Manual items are in-memory only and reset on reload.
- Dollar parsing is USD-oriented and uses a period decimal separator.
- Deadline entry uses `YYYY-MM-DD` and stores noon UTC for deterministic
  date-only behavior; user-local timezone handling and a native picker are deferred.

### Commit

Not created. Per milestone instructions, no commit, tag, or push was performed.

### Build Log Updated

- [x] `docs/BUILD_LOG.md`
