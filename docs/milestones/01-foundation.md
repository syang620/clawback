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
