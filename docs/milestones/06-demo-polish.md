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
