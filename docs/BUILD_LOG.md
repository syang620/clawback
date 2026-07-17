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

Pending manual review. No commit or push was created.

### Codex Session

Primary session identifier pending `/feedback` capture.
