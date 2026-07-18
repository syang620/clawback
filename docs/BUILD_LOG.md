# Clawback Build Log

This document records the actual build history of Clawback.

Update it after each meaningful Codex session or milestone.

## How to Record an Entry

Use this format:

```md
## YYYY-MM-DD — Milestone or Task

### Objective

What the session attempted to accomplish.

### Codex Contribution

What Codex inspected, generated, changed, tested, or debugged.

### Team Decisions

Product, design, or technical decisions made by the team.

### Files Changed

- `path/to/file`
- `path/to/file`

### Verification

- Command: result
- Manual check: result

### Problems and Resolutions

What failed and how it was addressed.

### Remaining Limitations

Known issues or deferred work.

### Commit

Commit hash or message.

### Codex Session

Primary session identifier or note. Record the final `/feedback` Session ID near submission.
```

---

## 2026-07-16 — Project Definition

### Objective

Define the Clawback concept, MVP direction, technical stack, and build workflow for OpenAI Build Week 2026.

### Codex Contribution

Codex was selected as the primary development agent. The planned workflow uses bounded autonomy by milestone.

### Team Decisions

- Project name: Clawback
- Primary experience: mobile-first Expo application
- Judge access: web-compatible build
- Runtime AI: GPT-5.6 through the OpenAI Responses API
- Backend: Supabase
- Core interaction: swipe-to-strike
- Initial AI input: pasted email text
- No automatic cancellation in MVP
- Review-before-save is mandatory
- GitHub repository will be used

### Verification

Documentation review pending.

### Remaining Limitations

The project has not yet completed application scaffolding.

### Commit

Pending.

### Codex Session

Pending.

---

## 2026-07-16 — Milestone 01 Application Foundation

### Objective

Create a runnable Expo foundation and polished static Clawback dashboard using
local deterministic demo data, without beginning Milestone 02.

### Codex Contribution

- Compared the temporary Expo SDK 57 scaffold against the existing repository
  and preserved all user-authored guidance and documentation.
- Configured Expo Router, strict TypeScript, NativeWind 4.2.4, SPA web output,
  linting, formatting, and single-run Jest tests.
- Completed a NativeWind smoke-screen checkpoint before dashboard work.
- Added the documented `FinancialItem` model, deterministic UTC demo data, the
  four approved dashboard helpers, responsive dashboard components, and state components.
- Added 14 focused business-logic and component tests.

### Team Decisions

- Milestone 01 includes only `calculateDashboardMetrics`, `findNextDueItem`,
  `formatMoney`, and `formatAbsoluteDate` business helpers.
- FoundersCard remains the earliest demo deadline at date boundaries.
- UTC is a deterministic demo/testing convention, not the final timezone design.
- Completion, ranking, relative deadlines, Activity, swipe, and Undo remain in Milestone 02.
- The web application uses Expo's single-page output mode.

### Files Changed

- Application and tooling configuration at the repository root
- `app/`, `components/`, `features/financial-items/`, `constants/`, `lib/`, and `types/`
- `tests/`
- `README.md`, `.gitignore`, `.env.example`
- `docs/milestones/01-foundation.md`
- `docs/BUILD_LOG.md`

### Verification

- Foundation `npm run typecheck`: passed
- Foundation `npx expo export --platform web`: passed
- `npx expo install --check`: passed with offline-validation warning
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format:check`: passed
- `npm test`: passed, 4 suites and 14 tests
- Final `npx expo export --platform web`: passed
- Exported production HTML, CSS, and JavaScript: HTTP 200 from temporary server
- Development web server: bundled and ran without final runtime errors
- iOS launch: blocked because full Xcode is not installed or selected
- Desktop manual review: passed
- Dashboard totals: passed at Available $57, At Risk $595, and Clawed Back $0
- Three demo tasks, FoundersCard treatment, absolute dates, sample-data indicator,
  color-independent urgency, reload behavior, and no credential prompt: passed
- No visible horizontal overflow at the reviewed desktop width
- Mobile, narrow, console, keyboard, screen-reader, 200% zoom, dashboard empty,
  loading, error, and iOS manual checks: pending

### Problems and Resolutions

- The Expo template collided with `.gitignore`, `AGENTS.md`, and `README.md`;
  those files were preserved and required settings were merged intentionally.
- The first development web smoke check exposed a NativeWind color-scheme error.
  NativeWind dark mode was changed to class-based configuration, after which the
  web development server ran without the error.
- The sandbox could not bind a local production server, so the approved temporary
  server was run outside the sandbox and then terminated.
- npm audit reports 11 moderate findings through a transitive `uuid` dependency
  in the Expo configuration/Xcode toolchain. The available forced fix proposes
  an incompatible dependency change, so no audit-fix command was applied. The
  finding is documented as a known transitive issue, not a failed milestone check.

### Remaining Limitations

- Desktop visual review passed. Mobile at 390×844 and narrow at 320×700 remain pending.
- Browser console, keyboard focus, screen-reader order, 200% zoom, and the empty,
  loading, and error states remain pending manual verification.
- Task cards are relatively tall on desktop; this is deferred for demo-polish review.
- The “Sample data” pill resembles a button visually, but implementation inspection
  confirms it is noninteractive and not keyboard-focusable.
- Full Xcode must be installed and selected before iOS Simulator verification.
- The 11 moderate npm audit findings remain as a known transitive dependency issue.
- Milestone 02 and all backend or AI behavior remain unimplemented.

### Commit

- Commit: `48eb865`
- Tag: `milestone-01`
- Push: successful to `origin/main`, including the milestone tag

### Codex Session

Primary session identifier pending `/feedback` capture.

---

## 2026-07-17 — Milestone 02 Checkpoint 2A Core Behavior

### Objective

Implement deterministic prioritization, shared local completion state, visible
Complete and Undo controls, task details, and Activity without beginning the
native swipe checkpoint.

### Codex Contribution

- Corrected the accepted Milestone 01 record with commit `48eb865`, tag
  `milestone-01`, and successful push details while preserving its exact manual status.
- Added deterministic UTC urgency bands, exact relative deadline labels, and the
  approved ranking tie-break order.
- Added pure completion/restoration transitions and shared in-memory route state.
- Added Home, Activity, and task-detail navigation, accessible Complete and Undo
  controls, and explicit HTTPS action links.
- Added focused unit and component coverage, including duplicate-completion and
  invalid-link behavior.

### Team Decisions

- Urgency presentation and relative deadline wording are separate.
- Ranking uses urgency band, exact deadline, relevant amount, risk-bearing kind,
  and ID in that order.
- Past-due active items remain visible and are not silently expired.
- Production SPA hosts must fall back application routes to `index.html`.
- Checkpoint 2A manual web review passed before Checkpoint 2B planning began.
- The current metric-card color themes are accepted. Stronger backgrounds,
  white values, and supporting symbols are deferred to Milestone 06 review.

### Files Changed

- `app/`, `components/`, and `features/financial-items/`
- `lib/urls.ts`
- `tests/`
- `README.md`
- Milestone completion records and `docs/BUILD_LOG.md`

### Verification

- `npx expo install --check`: passed with Expo's offline-validation warning
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format:check`: passed
- `npm test`: passed, 9 suites and 38 tests
- `npx expo export --platform web`: passed
- Development HTTP route refreshes: `/`, `/activity`, valid detail, and unknown
  detail returned 200
- Temporary production SPA fallback: the same four routes returned the exported
  `index.html` with HTTP 200
- Manual web review: passed for metrics, deadline presentation, navigation,
  direct and refreshed routes, recovery, trial and perk completion, Activity,
  Undo, keyboard/focus behavior, live announcement, responsiveness, console,
  and HTTPS action-link presentation
- Xcode readiness: Xcode 26.6, build 17F113 confirmed

### Problems and Resolutions

- Expo's generated typed-route cache did not initially include the new routes;
  route hrefs were kept type-safe across generation, and export refreshed the cache.
- A stale Expo process occupied port 8081 and served an obsolete module error. It
  was stopped, the current application was started, and all route checks then passed.
- No browser-control session was exposed during implementation, so interactive
  behavior was initially left pending. The subsequent user-run manual web review
  passed every Checkpoint 2A item.

### Remaining Limitations

- State is local and resets on refresh.
- A possible higher-contrast metric-card treatment with symbols is deferred to
  Milestone 06 demo polish; the current blue, red, and green themes remain accepted.
- Checkpoint 2B swipe, animation, haptics, reduced-motion fallback, and iOS
  Simulator verification have not started.
- Backend, authentication, manual entry, email parsing, and notifications remain out of scope.

### Commit

Not created. No commit, tag, or push was performed.

### Codex Session

Primary session identifier pending `/feedback` capture.

---

## 2026-07-17 — Milestone 02 Checkpoint 2B Swipe-to-Strike

### Objective

Add the native iOS swipe-to-strike interaction, Reanimated feedback, safe
haptics, reduced-motion behavior, and deterministic gesture cleanup without
changing Checkpoint 2A task semantics.

### Codex Contribution

- Installed Expo SDK 57-compatible Gesture Handler 2.32.0 and Haptics 57.0.1.
- Strengthened the provider's synchronous item ref and functional React update
  so rapid completion calls are atomic before rerender.
- Added one shared completion-with-feedback path that requests haptics only when
  the provider accepts the transition.
- Added a measurement-gated left-to-right swipe with an exact 60% threshold and
  Reanimated strike feedback.
- Added consolidated reduced-motion handling that defaults to no animation while
  the preference resolves and cleans up its accessibility listener.
- Added local-only reset behavior for completion, route blur, unmount, Undo
  remounting, and button completion from a partial swipe.
- Expanded the test suite from 38 to 47 tests across 12 suites.

### Team Decisions

- The provider remains the authoritative task-state and duplicate-completion guard.
- Swipe is unavailable before positive-width measurement; the Complete button
  remains usable throughout.
- Web and reduced-motion modes omit the swipe wrapper and animated strike entirely.
- Route and unmount cleanup reset only gesture-local state.
- Simulator haptic execution cannot prove physical tactile feedback.
- Checkpoints 2A and 2B are accepted after automated, web, and iOS Simulator review.

### Files Changed

- `package.json` and `package-lock.json`
- `app/_layout.tsx` and completion route wiring
- Financial-item provider, hooks, card list, and new swipe component
- `hooks/use-reduced-motion-preference.ts` and `lib/haptics.ts`
- Focused provider, swipe, haptic, and reduced-motion tests
- Milestone documentation and `README.md`

### Verification

- `npx expo install --check`: passed with Expo's offline-validation warning
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format:check`: passed
- `npm test`: passed, 12 suites and 47 tests
- `npx expo export --platform web`: passed
- `git diff --check`: passed
- Development web route checks: Home, Activity, valid detail, and unknown detail
  returned HTTP 200
- Exported SPA fallback: the same four routes returned identical `index.html`
  documents with HTTP 200
- iOS: bundled and rendered in Expo Go on the iPhone 17 Pro Simulator
- iOS CI-mode retry: bundled in 832 ms and remained connected during polling

### Manual Review

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
- Partial swipe followed by Complete leaves no stale position
- Undo restores a fresh closed card
- Navigation resets partial gesture state
- Vertical scrolling remains usable
- Reduced Motion removes swipe and animation
- Complete, metrics, Activity, and Undo work with Reduced Motion
- Expo Haptics executed without runtime errors
- No Metro gesture, animation, or navigation errors were observed

Physical tactile feedback was not verified because testing used the Simulator.

### Problems and Resolutions

- The first offline dependency installation stalled during npm resolution. The
  approved versions were retained and `npm install` completed the lockfile and modules.
- npm continues to report the known 11 moderate transitive findings. No audit fix
  or forced incompatible remediation was applied.
- One earlier Expo session encountered `WS_ERR_TOO_MANY_BUFFERED_PARTS`. A clean
  `CI=1 EXPO_OFFLINE=1` session bundled and remained stable, and no corresponding
  application defect was observed.

### Remaining Limitations

- Physical tactile feedback remains unverified until tested on a real iPhone.
- State remains local and resets on refresh.
- Backend, authentication, manual entry, email parsing, and notifications remain out of scope.

### Commit

Not created. No commit, tag, or push was performed.

### Codex Session

Primary session identifier pending `/feedback` capture.

---

## 2026-07-18 — Milestone 03 Manual Financial Item Creation

### Objective

Allow a user to create trial, perk, and subscription reminders manually, keep
validation trustworthy, and update the existing local dashboard immediately.

### Codex Contribution

- Added Add navigation, a three-type choice screen, and a responsive manual form.
- Added pure validation for required fields, UTC calendar dates, safe HTTPS URLs,
  and USD input converted directly from digit strings into integer cents.
- Preserved blank versus zero amounts and retained raw form values after errors.
- Extended the existing provider with atomic in-memory creation and session-unique IDs.
- Reused the accepted ranking, metrics, detail, completion, and Undo behavior.
- Expanded coverage from 47 to 79 tests across 14 suites.

### Team Decisions

- Manual creation remains local and synchronous for Milestone 03.
- Both money fields remain optional and visible; perks emphasize Value Available,
  while trials and subscriptions emphasize Charge at Risk.
- Calendar dates use a dependency-free `YYYY-MM-DD` input and noon UTC storage.
- Saving creates an active manual reminder and never claims to perform a financial action.
- Notes, email parsing, persistence, editing, notifications, and automatic
  cancellation remain out of scope.

### Files Changed

- Add and manual-entry routes plus primary Add navigation
- Manual-entry components and provider creation support
- Financial-item creation types and pure date/money/form validation
- Focused logic, component, and provider tests
- `README.md`, the Milestone 03 completion record, and this build log

### Verification

- `npx expo install --check`: passed with Expo's offline-validation warning
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format:check`: passed
- `npm test`: passed, 14 suites and 79 tests
- `npx expo export --platform web`: passed
- `git diff --check`: passed
- Development Home, Add, valid manual, and invalid-kind manual routes: HTTP 200
- Exported SPA fallback: the same four routes returned identical `index.html`
  documents with HTTP 200
- iOS: bundled 1,784 modules and rendered the perk form in Expo Go on an iPhone
  17 Pro Simulator without Metro or navigation errors

### Manual Review

- Task-type switching: passed; Trial and Subscription prioritize Charge at Risk,
  while Perk prioritizes Value Available
- Web creation for trial, perk, and subscription: passed
- Web metrics, existing ranking, new-item completion, and Undo: passed
- Web blank-versus-zero behavior, currency validation, calendar validation and
  date stability, required-field value preservation, and HTTPS validation: passed
- Web Cancel, keyboard navigation and focus, error announcements, 200% zoom,
  responsive layout, browser console, and documented refresh reset: passed
- iOS creation for all three types, keyboard avoidance and scrolling, date input,
  validation value preservation, Cancel and Save navigation, and VoiceOver: passed
- iOS Metro and navigation errors: none observed
- Milestone 03: accepted after manual review

### Problems and Resolutions

- The browser-control environment exposed no browser session during implementation;
  the subsequent user-run manual web review passed.
- The first component assertion targeted text nested with its optional label. It
  was corrected to query the field's accessibility label, and the full suite passed.
- Expo repeated the existing offline dependency-validation and
  `NO_COLOR`/`FORCE_COLOR` warnings; neither caused a build failure.

### Remaining Limitations

- Manual entries reset on reload and are not persisted.
- USD input uses a period decimal separator; broader locale handling is deferred.
- User-local date handling and a native date picker are deferred.
- Milestone 04 and all backend, authentication, AI, and email behavior remain out of scope.

### Commit

Committed as `9ddbd84` with message
`feat: add manual financial task creation`, pushed to `origin/main`, tagged
`milestone-03`, and the tag was pushed successfully.

### Codex Session

Primary session identifier pending `/feedback` capture.

---

## 2026-07-18 — Milestone 04 Checkpoint 4A Backend Foundation

### Objective

Establish secure Supabase persistence infrastructure, typed repository
boundaries, anonymous-session support, and deterministic one-time seeding before
changing the accepted provider or user interface.

### Codex Contribution

- Added the minimal Expo-compatible Supabase dependency set and one typed client
  with persistent SQLite-backed sessions.
- Added strict demo/connected/error environment resolution and a single
  remount-safe native token-refresh lifecycle.
- Added anonymous session restoration/creation and matching local/Supabase
  financial-item repositories behind one asynchronous interface.
- Added runtime database mapping, canonical noon-UTC date-only conversion, and
  normalized repository/authentication failures.
- Added a committed schema migration with constraints, timestamps, owner-scoped
  indexing, RLS, least-privilege grants, and transactional idempotent demo seed.
- Added generated database types plus focused Jest and pgTAP coverage.

### Team Decisions

- Connected mode uses persisted Supabase anonymous authentication; missing
  configuration uses credential-free demo mode, while partial or unsafe
  configuration is an explicit error.
- All user data and bootstrap markers are owned by `auth.uid()` and exposed only
  to the `authenticated` role through RLS.
- The seed function is `SECURITY INVOKER`, accepts no user ID, requires a
  non-null authenticated identity, and may insert the three demo rows once.
- Date-only input uses 12:00 UTC consistently during this milestone; user-local
  timezone conversion remains deferred.
- The provider remains the future application state authority. No provider or UI
  integration was started before the Checkpoint 4A hard gate.

### Verification

- `npx expo install --check`: passed
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format:check`: passed
- `npm test`: passed, 20 suites and 104 tests
- `npx expo export --platform web`: passed, 1,296 modules bundled
- `git diff --check`: passed
- `.env`/`.env.local` ignore and application secret scan: passed
- `npx supabase db reset`: passed locally; migration applied from a clean database
- `npx supabase db lint --local --fail-on warning`: passed with no schema errors
- `npx supabase test db`: passed, 37 pgTAP checks
- Local two-user RLS, unauthenticated-write denial, bootstrap-marker isolation,
  least-privilege grants, database constraints, timestamp transitions, and
  one-time seed behavior: passed
- Hosted publishable-key connection, anonymous sign-in, and same-client session
  recovery: passed
- Hosted `financial_items` read: blocked with `PGRST205` because the table is not
  available through the hosted API; migration and hosted RLS checks remain pending
- Expo web export using the ignored `.env.local`: passed without exposing values

### Problems and Resolutions

- The initial dependency installation stalled in the restricted environment;
  the approved network-enabled retry completed successfully.
- An unused `@supabase/ssr` dependency was removed so the dependency set contains
  only packages required by the current Expo/Supabase guidance.
- Freshly generated database types differed only in formatting until the
  project formatter was applied; the checked-in types now follow repository
  formatting.
- The local Supabase stack initially downloaded its Docker images and reported
  transient registry rate warnings, then started successfully. Clean reset,
  schema lint, and pgTAP verification all passed afterward.
- Hosted anonymous authentication succeeded, but the read-only database check
  returned `PGRST205`; the committed migration has not yet made
  `public.financial_items` available through that project's API.
- npm continues to report the existing 11 moderate transitive findings. No
  forced or incompatible audit remediation was applied.

### Remaining Limitations

- Checkpoint 4B has not started. The current provider/UI still uses local seeded
  and session-only data.
- Connected-mode web refresh and iOS relaunch persistence are not testable until
  the provider is integrated.
- The migration must be applied to the hosted development project before hosted
  RLS verification can run.
- Anonymous identities cannot be recovered after local auth storage is removed.

### Commit

Not created. No commit, tag, or push was performed.

### Codex Session

Primary session identifier pending `/feedback` capture.
