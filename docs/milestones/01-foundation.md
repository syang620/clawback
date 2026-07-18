# Milestone 01 — Application Foundation

## Objective

Create a runnable Expo application with a polished static Clawback dashboard using local seed data.

## User-Visible Outcome

A user can open Clawback on iOS or web and immediately understand:

- What financial value is available
- What money is at risk
- Which tasks are most urgent
- How the product helps them act

## Required Reading

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN.md`

## In Scope

- Expo application initialization
- Expo Router
- TypeScript strict mode
- NativeWind
- Stable Expo-compatible dependencies
- Home dashboard
- Summary metric cards
- Three seeded financial tasks
- Basic navigation
- Responsive web layout
- Reusable task-card component
- Empty, loading, and basic error components
- README setup instructions
- Type-check, lint, and test scripts

## Out of Scope

- Supabase
- Authentication
- GPT-5.6
- Email parsing
- Real persistence
- Notifications
- Production deployment
- Full swipe completion
- Manual task forms

## Seeded Tasks

### FoundersCard Trial

- Type: Trial
- Large charge at risk
- Future cancellation deadline
- Action URL

### Amex Gold Dunkin' Credit

- Type: Perk
- $7 value
- Monthly recurrence
- Future month-end deadline

### Hilton Aspire Airline Benefit

- Type: Perk
- $50 value
- Quarterly recurrence
- Future quarter-end deadline

Dates must be generated relative to the current date or otherwise remain in the future.

## Acceptance Criteria

1. The application starts successfully on web.
2. The iOS target can be launched when the local Xcode environment permits it.
3. TypeScript strict mode is enabled.
4. The dashboard displays Available, At Risk, and Clawed Back totals.
5. Totals are calculated from seed data.
6. Three seeded financial items appear.
7. The most urgent item is visually obvious.
8. The layout works at mobile and desktop widths.
9. No external credentials are required.
10. Type-checking and linting pass.
11. At least basic business-logic tests run.
12. README launch instructions are accurate.

## Suggested Implementation Tasks

1. Inspect repository and current tooling.
2. Initialize Expo in the current folder.
3. Configure Router, TypeScript, NativeWind, linting, formatting, and tests.
4. Define domain types and local demo data.
5. Implement metric calculations.
6. Build dashboard layout.
7. Build reusable task cards and urgency labels.
8. Add basic navigation.
9. Verify iOS and web.
10. Update documentation.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npx expo export --platform web
```

Manual checks:

1. Open at narrow mobile width.
2. Open at desktop width.
3. Confirm all task values are understandable.
4. Confirm dates are in the future.
5. Confirm no horizontal overflow.
6. Confirm no API credentials are requested.

## Completion Record

To be filled in after implementation.

### Status

Accepted, committed, tagged, and pushed. Automated checks and both web smoke
checks pass. Desktop manual review passed, with the remaining viewport,
accessibility, state, and console checks documented below as pending. iOS
verification is deferred until the full Xcode environment is available.

### Files Changed

- Expo, Router, NativeWind, TypeScript, lint, formatting, and test configuration
- `app/`, `components/`, `features/financial-items/`, `constants/`, `lib/`, and `types/`
- `tests/` with focused Milestone 01 business-logic and component coverage
- `README.md`, `.gitignore`, `.env.example`, and `docs/BUILD_LOG.md`

### Verification Results

- Foundation checkpoint: `npm run typecheck` passed.
- Foundation checkpoint: `npx expo export --platform web` passed.
- `npx expo install --check` passed using Expo's local dependency map; Expo warned
  that offline dependency validation is less reliable.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run format:check` passed.
- `npm test` passed: 4 suites and 14 tests.
- `npx expo export --platform web` passed and produced the SPA in `dist/`.
- The exported `index.html`, CSS, and JavaScript returned HTTP 200 from a temporary
  local server and contained the expected dashboard assets/content.
- `npm run web` bundled and ran after resolving a NativeWind dark-mode setting.
- `npm run ios` failed because full Xcode is not installed or selected. Expo's
  remediation is `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.

### Manual Review

Verified:

- Desktop layout passed.
- Dashboard totals passed: Available $57, At Risk $595, and Clawed Back $0.
- Exactly three demo tasks passed.
- FoundersCard “Next deadline” treatment passed.
- Absolute calendar dates without time components passed.
- Urgency is not communicated through color alone.
- The sample-data indicator is visible.
- No visible horizontal overflow was observed at the reviewed desktop width.
- No credential prompt appeared.
- Reloading continued to show sample data.
- The design was judged coherent and financially trustworthy.

Observation:

- Task cards are relatively tall on desktop. This is not a Milestone 01 blocker
  and may be reconsidered during demo polish.
- The “Sample data” pill visually resembles a button. Implementation inspection
  confirms it is noninteractive `View`/`Text` content with no press handler,
  button role, or keyboard-focusable behavior.

Pending manual verification:

- Mobile layout at 390×844
- Narrow layout at 320×700
- Browser console errors or warnings
- Keyboard focus behavior
- Screen-reader labels and reading order
- Behavior at 200% browser zoom
- Dashboard empty-state rendering
- Loading-state rendering
- Error-state rendering
- iOS Simulator, pending full Xcode setup

### Known Limitations

- Automated browser screenshot/viewport inspection was unavailable in this environment.
- iOS Simulator launch awaits full Xcode installation and selection.
- Demo dates intentionally use UTC calendar values; user-local timezone handling is deferred.
- Data is local and static. All Milestone 02 interactions remain unimplemented.
- npm audit reports 11 moderate findings caused by a transitive `uuid`
  dependency in the Expo configuration/Xcode toolchain. The available forced
  remediation proposes an incompatible dependency change, so neither
  `npm audit fix` nor `npm audit fix --force` was applied. This is tracked as a
  known transitive dependency issue rather than a failed Milestone 01 check.

### Commit

- Commit: `48eb865`
- Tag: `milestone-01`
- Push: successful to `origin/main`, including the milestone tag

### Build Log Updated

- [x] `docs/BUILD_LOG.md`
