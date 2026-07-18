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

Checkpoints 2A and 2B are accepted, and Milestone 02 is accepted as complete.
Automated verification, web regression review, and iOS Simulator gesture review
passed. Physical tactile haptic feedback remains unverified without a real iPhone.

### Files Changed

- Shared in-memory financial-item provider with completion and Undo
- Deterministic urgency, relative-deadline, ranking, and status-transition logic
- Home, Activity, and task-detail routes with accessible button interactions
- HTTPS action-link validation and truthful protected/reclaimed copy
- Focused Checkpoint 2A business-logic and platform-safe component tests
- SPA fallback guidance in `README.md`
- Corrected Milestone 01 commit, tag, push, and review records
- Expo-managed Gesture Handler and Haptics dependencies
- Atomic provider completion guard and shared completion-with-feedback callback
- Measurement-gated native swipe-to-strike with Reanimated feedback
- Consolidated reduced-motion preference and local gesture reset handling
- Focused swipe, haptic, reduced-motion, and rapid-completion tests

### Verification Results

- `npx expo install --check` passed using Expo's offline dependency map; Expo
  repeated that offline dependency validation is less reliable.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run format:check` passed.
- `npm test` passed: 12 suites and 47 tests.
- `npx expo export --platform web` passed and produced the SPA in `dist/`.
- Development-server HTTP refresh checks returned 200 for `/`, `/activity`, a
  valid `/item/[id]`, and an unknown item route.
- A temporary standard-library server with an `index.html` fallback returned
  the same exported SPA document with HTTP 200 for all four routes. No permanent
  server or dependency was added.
- Full Xcode readiness is now confirmed: Xcode 26.6, build 17F113.
- `react-native-gesture-handler` 2.32.0 and `expo-haptics` 57.0.1 are installed
  at Expo SDK 57-compatible versions.
- Checkpoint 2B development-server route checks returned HTTP 200 for Home,
  Activity, a valid item, and an unknown item.
- The Checkpoint 2B exported SPA returned the same `index.html` with HTTP 200 for
  all four routes through the temporary fallback server.
- The iOS bundle compiled and rendered in Expo Go on an iPhone 17 Pro Simulator.
  A screenshot confirmed the dashboard and completion controls rendered.
- The first non-CI iOS server later exited with
  `WS_ERR_TOO_MANY_BUFFERED_PARTS`. A CI-mode retry bundled in 832 ms, rendered,
  and remained stable during subsequent polling.

### Manual Review

Passed:

- Initial dashboard metrics
- Separate urgency, relative-deadline, and absolute-date presentation
- Home-to-Activity navigation
- Home-to-detail navigation and Browser Back
- Direct and refreshed SPA routes
- Unknown-item recovery state
- Trial completion, Activity placement, metric updates, and Undo
- Perk completion, metric updates, and Undo
- Keyboard activation and visible focus
- Undo live announcement
- Responsive layout
- Browser console review
- HTTPS action-link presentation

Observation:

- The blue Available, red At Risk, and green Clawed Back themes are accepted.
  A possible later treatment using stronger backgrounds, white values, and
  supporting symbols is tracked in Milestone 06 demo polish. No Checkpoint 2A
  product-code change was required.

Checkpoint 2B web regression passed:

- No swipe dependency on web
- Complete and metric updates
- Rapid duplicate activation protection
- Activity entry count
- Undo restoration
- Keyboard activation and visible focus
- Navigation and SPA routes
- Browser console review
- Responsive layout and overflow

Checkpoint 2B iOS Simulator review passed:

- Full swipe beyond the activation threshold completes exactly once
- Below-threshold swipe returns fully closed
- Partial swipe followed by Complete leaves no stale translation
- Undo restores a fresh closed card
- Navigation resets partial gesture state
- Vertical scrolling remains usable around swipeable cards
- Reduced Motion removes swipe and animation
- Complete, metrics, Activity, and Undo work with Reduced Motion
- Expo Haptics executed without runtime errors
- No Metro gesture, animation, or navigation errors were observed

Physical tactile feedback was not verified because testing used the Simulator.

### Known Limitations

- State is local and resets on reload.
- UTC calendar arithmetic remains a deterministic demo/testing convention;
  user-local timezone handling is deferred.
- Production SPA hosting requires an `index.html` fallback for application routes.
- Simulator execution cannot verify physical tactile feedback. Actual haptics
  remain unverified until tested on a real iPhone.
- One earlier Expo development session encountered
  `WS_ERR_TOO_MANY_BUFFERED_PARTS`. A clean `CI=1 EXPO_OFFLINE=1` session bundled
  and remained stable, and no corresponding application defect was observed.

### Commit

Not created. Per milestone instructions, no commit, tag, or push was performed.

### Build Log Updated

- [x] `docs/BUILD_LOG.md`
