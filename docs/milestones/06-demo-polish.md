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

- Deferred until 6A acceptance.

### Checkpoint 6C — Accessibility, responsive behavior, and cleanup

- Deferred until 6B acceptance.

### Checkpoint 6D — Deployment and final acceptance

- Deferred until 6C acceptance.

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
Checkpoints 6B through 6D have not started.

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

- The reset-facing marker transition is defined and tested, but Checkpoint 6B
  reset controls and dataset restoration are intentionally not implemented.
- Loading/error polish, external-link recovery, broader accessibility cleanup,
  and public deployment remain deferred to their approved checkpoints.

### Commit

- Pending

### Build Log Updated

- [x] `docs/BUILD_LOG.md`
