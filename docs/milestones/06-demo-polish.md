# Milestone 06 — Demo Polish and Reliability

## Objective

Turn the functional MVP into a coherent, memorable, and judge-friendly product experience.

## User-Visible Outcome

A judge can understand Clawback quickly, complete the core workflow without assistance, and recover from common errors.

## Required Reading

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/DESIGN.md`
- `docs/ARCHITECTURE.md`
- `docs/milestones/05-ai-email-parsing.md`

## In Scope

- Visual hierarchy refinement
- Review whether metric cards should use stronger semantic backgrounds, white
  values, and supporting symbols while retaining the accepted blue, red, and
  green themes
- Responsive web polish
- Completion animation refinement
- Empty states
- Loading states
- Error recovery
- Demo-data reset
- First-run explanation
- Accessibility pass
- Reduced-motion pass
- Action-link safety presentation
- Consistent copy
- Performance cleanup
- Warning cleanup
- Public web deployment
- Demo credentials or demo mode instructions

## Out of Scope

- Major new product features
- Gmail OAuth
- Automatic cancellation
- New backend architecture
- Comprehensive card database
- App Store distribution
- Unnecessary design-system rebuild

## Acceptance Criteria

1. A first-time judge understands the value proposition within 20 seconds.
2. The seeded demo is accessible without configuration.
3. The full AI workflow can be demonstrated.
4. Web layout is intentional at mobile and desktop widths.
5. Empty, loading, and error states are complete.
6. Completion feedback is satisfying but restrained.
7. Swipe has an accessible fallback.
8. Keyboard focus is visible on web.
9. Reduced-motion behavior remains usable.
10. Demo data can be reset.
11. No serious console warnings remain.
12. Public deployment loads successfully.
13. Setup and judge instructions are accurate.

## Suggested Implementation Tasks

1. Conduct a product walkthrough.
2. Fix top usability issues.
3. Refine dashboard hierarchy.
4. Refine completion feedback.
5. Complete empty/loading/error states.
6. Add demo reset.
7. Perform accessibility pass.
8. Perform responsive pass.
9. Remove warnings and dead code.
10. Deploy web build.
11. Verify from a clean browser session.
12. Update docs.

## Checkpoint Plan

### Checkpoint 6A — Audit, first-run clarity, and reset contract

- Derive canonical state from the existing shared seed factory and source
  semantics without changing the database or domain enum.
- Keep canonical data comparison separate from a transient, provider-scoped
  meaningful-interaction marker.
- Show one compact, inline Home explanation only after a complete canonical
  load and before a successful create or completion in the current provider
  session.
- Keep the marker sticky across Undo, route remount, and initialization retry.
- Define the explicit Local-reset transition that clears the marker, while
  deferring all reset controls and dataset replacement to Checkpoint 6B.
- Make metric wrapping intentional through responsive styling without runtime
  viewport state.
- Complete deterministic coverage before manual width, zoom, keyboard, and
  unfamiliar-person review.

### Checkpoint 6B — States and interaction polish

- Add confirmation-gated, atomic Local-demo reset and non-destructive Connected
  guidance.
- Add recovery actions for Home and Activity empty states.
- Refine startup/loading/configuration presentation without changing
  initialization behavior.
- Add fail-closed external-action opening with safe Retry and Dismiss.
- Make Undo presentation wrap safely and add an explicit Dismiss action.

### Checkpoint 6C — Accessibility, responsive behavior, and cleanup

- 6C-1 semantics and focus: completed and accepted through the compressed owner
  keyboard and VoiceOver smoke gate.
- Broad 6C-2 implementation: intentionally deferred for the July 21 submission
  deadline. The unperformed reduced-motion, responsive/zoom, warning, and
  performance matrices are deferred, not passed. No known submission-blocking
  defect remains in those areas.

### Checkpoint 6D — Deployment and final acceptance

- Configure the Expo single-page export for Netlify, add the exact production
  origin to the hosted extraction allow-list, verify direct route refreshes,
  complete one clean private-browser hosted GPT-5.6 walkthrough, scan the
  client export for secrets, and record judge/video instructions.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npx expo export --platform web
```

Manual checks:

1. Use a clean browser.
2. Complete the full demo without developer tools.
3. Test narrow and wide layouts.
4. Test keyboard-only interaction.
5. Test reduced motion.
6. Simulate AI failure.
7. Reset demo data.
8. Confirm all external links show safe destinations.

## Completion Record

To be filled in after implementation.

### Status

Checkpoint 6A accepted on 2026-07-19 after automated verification, owner visual
and behavioral review, and an isolated pristine Local-demo panel check.
Checkpoint 6B status is recorded below. Checkpoint 6C-1 implementation and its
compressed owner keyboard-only and VoiceOver acceptance are recorded below.
Broad Checkpoint 6C-2 work was intentionally deferred under the submission-time
decision above. Checkpoint 6D and Milestone 06 were accepted on 2026-07-20 after
the public deployment and hosted acceptance recorded below. Milestone 07 has
not started.

### Files Changed

- Canonical demo-state and transient session-interaction logic
- Financial-items provider pristine-state derivation
- Compact Home explanation and responsive metric layout
- Focused canonical-state, provider, initialization, and component tests
- Design, architecture, milestone, and build documentation

### Verification Results

- Focused 6A Jest tests: passed, 4 suites and 38 tests
- TypeScript: passed
- Lint: passed
- Formatting: passed
- Full Jest suite: passed, 29 suites and 217 tests
- Expo web export: passed, 1,370 modules in the final verification run
- `git diff --check`: passed

### Manual Review

- iPhone 17 Pro Simulator at a typical phone width: passed. Available and At
  Risk remained readable side by side, Clawed Back retained its full-width
  hierarchy, no horizontal clipping was visible, the first task remained easy
  to discover, and task controls remained clear.
- Wide desktop web: passed. Metrics used three equal cards, spacing and
  hierarchy appeared intentional, no horizontal overflow was visible, and task
  information and controls remained readable.
- Successful create and completion hid the pristine panel: passed. Undo and
  route navigation did not restore it, and loading/error states did not show
  it.
- The owner-supplied modified-dataset views correctly omitted the panel because
  their records were noncanonical.
- Pristine canonical Local-demo session on iPhone 17 Pro Simulator: passed in
  an isolated no-configuration audit launch. The panel was compact and visually
  secondary, its outlined Add CTA did not compete with the primary Add
  navigation, the first task remained visibly discoverable in the initial
  viewport, and the copy clearly stated that Clawback does not cancel or redeem
  automatically.
- Owner first-run comprehension and hierarchy review: accepted for Checkpoint
  6A. A separate timed unfamiliar-person study was not required for this
  checkpoint.
- VoiceOver full-flow review, comprehensive keyboard-only review, and the
  comprehensive 200% browser-zoom matrix remain deferred to Checkpoint 6C.

### Known Limitations

- At Checkpoint 6A acceptance, reset controls and interaction-state recovery
  were intentionally deferred. The Checkpoint 6B record below supersedes those
  deferrals. Broader accessibility cleanup and public deployment remain in
  Checkpoints 6C and 6D.

### Commit

- `d33b36b` — `feat: complete Milestone 06 checkpoint 6A`

### Build Log Updated

- [x] `docs/BUILD_LOG.md`

## Checkpoint 6B Completion Record

### Status

Checkpoint 6B was accepted by the owner on 2026-07-19 after deterministic
verification and the manual observations below. At that acceptance boundary,
Checkpoints 6C and 6D had not started; current 6C-1 work is recorded separately
below.

### Implemented Behavior

- Local demo exposes Demo controls at the end of Add. Reset requires explicit
  inline confirmation, creates the canonical three seeds with the provider
  reference date, validates them before committing, clears local changes,
  history, metrics, Undo, mutation presentation, and the session-interaction
  marker, then returns Home without a reload.
- Reset is rejected without state changes while a create, complete, or restore
  mutation is in flight. A synchronous reset guard prevents duplicate
  activation. No Supabase, deletion, or authentication operation is part of
  the reset path.
- Connected mode exposes no reset action. A passive Clean demo session note
  explains that records persist for the current anonymous session and that a
  fresh private/incognito browser session is separate; the original records
  remain unchanged and are unavailable from the new session.
- Home and Activity empty states now provide one clear recovery action, with a
  secondary Activity route on Home only when completed or expired history
  exists.
- Startup keeps the Clawback identity visible. Loading copy is user-facing;
  configuration and initialization errors use fixed safe messages and expose
  Retry only where it can help.
- Task details always present an Action-page state. Valid destinations show
  only their hostname, are revalidated immediately before `Linking.openURL`,
  and identify the destination as external. Missing or rejected URLs have no
  opener. Open failures expose safe, explicit Retry and Dismiss without an
  automatic retry or raw URL/platform error.
- Undo keeps the existing eight-second and pessimistic restore behavior. Its
  message and controls wrap, and visible Dismiss removes only the banner.
- Manual creation and AI review now share a platform-specific Deadline field.
  Android uses the Expo UI native date dialog, iOS stages the native inline
  picker in a Cancel/Use date modal, and web uses `<input type="date">`. Form
  state remains `YYYY-MM-DD`; existing validators and UTC-noon persistence are
  unchanged.
- Next deadline presentation now compares valid active calendar dates and marks
  every task tied on the minimum date. Completed, expired, and invalid-date
  tasks are excluded; ranking and display order are unchanged.

### Automated Verification

- Focused Checkpoint 6B tests: passed, 11 suites and 70 tests.
- Expo dependency compatibility check: passed
- TypeScript: passed
- Lint: passed
- Formatting: passed
- Full Jest suite: passed, 36 suites and 268 tests
- Expo web export: passed, 1,375 modules
- `git diff --check`: passed
- Normal deterministic commands did not invoke GPT-5.6 or hosted services.

### Manual Review

- Isolated Local-demo iPhone 17 Pro Simulator Add screen: passed a visual smoke
  check for the mode label, existing Add choices, and discoverable Demo
  controls without visible horizontal clipping.
- Local-demo reset matrix: passed after manual creation, completion with a
  pending Undo, Undo expiry, and Activity navigation. Confirmation Cancel and
  rapid duplicate confirmation passed; canonical tasks and metrics were
  restored, and an old Undo timer could not affect the reset state.
- Connected guidance: passed. No destructive reset was exposed, the panel read
  as information, the persistent-session/private-session explanation was
  clear, and existing Connected records remained unchanged.
- Home and Activity empty states: passed. Recovery actions worked and the copy
  did not imply that completed tasks had been deleted.
- Startup and configuration states: passed for normal startup, offline startup
  with Retry, and fail-closed partial invalid configuration. No raw secrets,
  endpoints, stack traces, or provider payloads were shown.
- External actions: passed for a valid open, one attempt per activation, no
  opener when the URL was missing, and a simulated failure with safe Retry and
  Dismiss. One Retry created one new attempt and task state remained unchanged.
- Undo: passed at phone width and 200% web zoom. Dismiss left the item completed
  and the banner introduced no horizontal overflow.
- Owner Deadline-picker review passed on iOS for opening, existing-value
  initialization, month/year/day selection, Cancel preservation, explicit Use
  date commit, empty-value non-commit, iPhone viewport fit, and no visible date
  shift. Web native-calendar opening, date selection, keyboard interaction, and
  shared use in both manual creation and AI review also passed. The picker-only
  review did not specifically inspect console or Metro output; no user-visible
  errors were observed during that review.
- Next-deadline ties: passed. Every active task sharing the earliest valid
  calendar deadline received Next deadline, ranking and display order remained
  unchanged, and the result was visually consistent on iOS and web.
- Final Checkpoint 6B warning gate: passed. The browser developer console and
  Metro/Expo terminal output were both explicitly inspected; no warnings were
  observed.
- VoiceOver full-flow, comprehensive keyboard-only review, reduced-motion
  review, and the comprehensive responsive/zoom matrix remain deferred to
  Checkpoint 6C and are not claimed as passed.

### Known Limitations

- Reset does not cancel an in-flight local write. It fails closed and leaves
  state unchanged until that write settles, after which the user can confirm
  reset again.
- Connected anonymous-session recovery architecture remains out of scope; the
  Add-screen guidance describes the current separation behavior without
  changing authentication.
- No Checkpoint 6B acceptance blockers remain. The broader accessibility,
  responsive, warning-cleanup, and performance passes remain assigned to
  Checkpoint 6C, and deployment remains assigned to Checkpoint 6D.

### Commit

- `a13875d` — `feat: complete Milestone 06 checkpoint 6B`

## Checkpoint 6C-1 Implementation Record

### Status

Semantics and focus implementation completed on 2026-07-19. Checkpoint 6C-1
was accepted by the owner on 2026-07-20 after the compressed critical smoke
test and deterministic verification recorded below. The acceptance gate was
intentionally reduced for the July 21 submission deadline. Checkpoint 6C-2 has
not started.

### Implemented Behavior

- Every route now supplies a concise document title and one focusable page
  heading. Route activation and extraction phase changes focus the current page
  heading without adding a visible onboarding step.
- The application exposes main, primary-navigation, list, list-item, page
  heading, section heading, link, button, radio, checked, disabled, busy, and
  current-page semantics without changing navigation or domain behavior.
- Manual creation and AI review share one ordered first-invalid-field focus
  contract. Email input validation uses the same request-based pattern. Web
  fields associate labels, requirements, hints, and errors through stable IDs;
  native fields retain concise labels and error hints.
- Loading and extraction progress use polite status announcements. Safe error
  text owns the alert announcement while Retry, Dismiss, and other recovery
  controls remain separate interactive elements.
- A new completion focuses Undo. Successful Undo focuses the current route page
  heading and announces exactly `Restored [task title] to active tasks.` Failed
  Undo, Dismiss, and expiry do not move page focus or claim restoration.
- Local reset confirmation focuses its destructive confirmation action; Cancel
  restores focus to Reset Local demo. Unexpected reset rejection is mapped to
  existing safe inline recovery without exposing an unhandled raw error.
- Deadline modal open focuses its title on iOS. Cancel, explicit Use date,
  Android dismissal, and iOS accessibility escape preserve the existing date
  contract and restore the trigger when it remains enabled.
- Dismissing an external-open failure restores focus to the preserved,
  revalidated opener. URL validation, duplicate-open locking, Retry, and
  persistence behavior are unchanged.
- The task and Activity collections expose list structure; task titles and
  quiet empty/unavailable headings participate in the heading hierarchy.
  Amount labels include their financial meaning. Unknown routes now provide a
  page heading and a semantic Home recovery destination.

### Automated Verification

- Final post-acceptance deterministic matrix rerun on 2026-07-20: passed.
- TypeScript: passed.
- Lint: passed.
- Formatting: passed.
- Full Jest suite: passed, 42 suites and 280 tests.
- Jest open-handle pass: passed, 42 suites and 280 tests.
- Expo dependency compatibility check: passed.
- Expo web export: passed, 1,180 modules in the final post-acceptance run.
- `git diff --check`: passed.
- Tests cover focus registration, page/section semantics, current navigation,
  ordered validation focus, web error association, reset focus and safe
  rejection, deadline modal focus restoration and accessibility escape,
  external-error Dismiss focus, Undo success/failure focus behavior, alert and
  status separation, and not-found recovery.
- Normal deterministic commands did not invoke GPT-5.6 or hosted services.
- Expo export emitted the known command-environment `NO_COLOR`/`FORCE_COLOR`
  warning. It is classified as development-tool environment output, not an
  application defect, and was not globally suppressed.
- The first July 20 rerun exposed one test-only wall-clock dependency in the
  email workflow's asserted reference date. The harness now injects a fixed
  date, while the rate-limit countdown retains its explicit advancing clock.
  This changed no extraction or product behavior; the complete matrix then
  passed.

### Owner Acceptance — Compressed Critical Smoke Test

- Web keyboard: passed for Home-to-Add navigation, one manual-form workflow,
  first-invalid-field focus, completion focus moving to Undo, and successful
  Undo returning focus to the current page heading.
- iOS VoiceOver: passed for the Home heading and primary navigation, one task
  card, Complete and Undo, manual-form required fields, and deadline-modal open,
  Cancel, and trigger-focus restoration.
- Browser developer console: explicitly inspected; no application warnings or
  errors were observed.
- Metro/Expo terminal output: explicitly inspected; no application warnings or
  errors were observed.
- Hosted GPT-5.6 extraction calls: zero. No concrete extraction-review defect
  required live reproduction.
- Submission acceptance blockers: none. No core control was unreachable; no
  focus trap, removed-content focus, repeated focus loop, unusable required
  field, serious application warning, or main-demo regression was found in the
  exercised paths.

### Deferred Manual Observations

The following were not exercised in the compressed owner pass and are not
claimed as passed: browser Back/Forward focus nuances; extraction loading and
review announcements; full extraction-review keyboard and VoiceOver coverage;
failed Undo focus recovery; Dismiss and automatic-expiry focus behavior; reset
confirmation focus; external-action error focus; not-found focus; Activity,
startup, and rare error-state VoiceOver paths; exhaustive task-card, metric,
amount, urgency, and announcement wording review. These are nonblocking
submission-time deferrals; deterministic coverage remains recorded above.

### Deferred to 6C-2

- Reduced-motion behavior and manual reduced-motion evidence.
- The full 320/375–390/430/tablet/wide/200%-zoom and long-content matrix.
- iOS keyboard/scrolling stress review, warning classification, and any small
  cleanup justified by measured behavior.
- No performance change is included in 6C-1; the planning baseline did not
  demonstrate a material rerender, ranking, startup, or bundle problem.

### Checkpoint 6C Closure

Checkpoint 6C closed on 2026-07-20. Checkpoint 6C-1 is complete and accepted.
Broad 6C-2 changes are intentionally deferred because the submission deadline
is July 21 at 8:00 PM ET. No speculative performance optimization, dead-code
cleanup, broad responsive change, or exhaustive reduced-motion implementation
was performed. The unperformed 6C-2 matrices remain documented as deferred and
are not claimed as passed. No known submission-blocking reduced-motion,
responsive, warning, or performance defect remains.

## Checkpoint 6D Implementation Record

### Status

Accepted on 2026-07-20. Netlify production deployment, exact hosted-origin
configuration, public route checks, deployed secret scans, one bounded
authenticated GPT-5.6 persistence smoke, and the owner-observed private-browser
workflow all passed. Checkpoint 6D and Milestone 06 are complete. Milestone 07
has not started.

### Deployment Contract

- Netlify builds with `npx expo export --platform web` and publishes `dist`.
- A non-forced `/*` status-200 rewrite serves `index.html` for application
  routes without replacing existing static assets.
- Netlify receives only `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Production build context.
- OpenAI, Supabase secret/service-role, JWT, database, and provider
  configuration remain server-side and absent from Netlify.
- The final stable HTTPS origin is present in the exact Edge Function
  allow-list. Preview and arbitrary origins remain rejected.
- No application architecture, database schema, extraction contract, rate
  limit, or product workflow changed.

Production URL:
[https://clawback-app-ai.netlify.app](https://clawback-app-ai.netlify.app)

### Repository Verification

- `npx expo install --check`: passed.
- TypeScript: passed.
- Lint: passed.
- Formatting: passed.
- Full Jest: passed, 42 suites and 280 tests.
- Expo web export: passed, 1,378 modules, output in ignored `dist/`.
- `git diff --check`: passed.
- Local SPA fallback returned HTTP 200 for `/`, `/activity`, `/add`,
  `/add/manual`, `/add/email`, and a representative `/item/:id` path.
- Tracked environment-path check passed; only `.env.example` is tracked.
- Tracked source, Git history, and exported-bundle secret-pattern scans passed.
  The committed `sb_secret_do-not-repeat` string remains an intentional
  validator test fixture and is not a usable credential.
- Client environment-name scan found only the two approved public Supabase
  variables.
- Normal tests and export made no hosted GPT-5.6 call.

### Hosted Boundary Evidence

- The linked hosted Supabase project is active and the expected Edge Function
  configuration names are present; secret values were not read or printed.
- The minimum configuration-only update set
  `AI_EXTRACTION_ALLOWED_ORIGINS` to exact localhost and production origins. No
  Edge Function code deployment was necessary.
- Exact localhost and `https://clawback-app-ai.netlify.app` preflights returned
  HTTP 204 and their own `Access-Control-Allow-Origin` values.
- A representative Netlify deploy-preview origin and an unrelated HTTPS origin
  each returned HTTP 403 with no allow-origin header.
- Direct public requests returned HTTP 200 for `/`, `/activity`, `/add`,
  `/add/manual`, `/add/email`, and a representative `/item/:id` route.
- Deployed assets contained the expected public Supabase URL and publishable-key
  form, and no OpenAI, service-role, secret-key, database, JWT, or AI-provider
  credential pattern. Repeated source and local-export scans also passed.
- One anonymous authenticated synthetic GPT-5.6 request used the production
  Origin and returned an actionable, reviewable candidate. A reviewed Save
  persisted `source: email` with confidence in `[0, 1]`; a restored-session
  reload found it; completion and Undo succeeded; cleanup deleted the temporary
  row. Exactly one hosted extraction call was made.
- The available browser-control surface had no browser session. Rendered UI
  interaction and browser-console inspection therefore required the owner
  evidence recorded below.

### Owner Production Acceptance

- Production URL: `https://clawback-app-ai.netlify.app`.
- Private-browser Connected initialization: passed.
- Rendered email extraction reached editable review: passed.
- Explicit Save required: passed.
- Saved task persisted after refresh: passed.
- Completion updated the app correctly: passed.
- Undo restored the task correctly: passed.
- Browser console: no serious application errors observed.
- Checkpoint 6D and Milestone 06: accepted on 2026-07-20.
- Milestone 07 was not started.

### Deployment Preparation Commit

- `0051391` — `chore: prepare Milestone 06 public deployment`
