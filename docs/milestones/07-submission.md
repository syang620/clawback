# Milestone 07 — Build Week Submission

## Objective

Prepare a complete, accurate, and testable OpenAI Build Week submission for Clawback.

## User-Visible Outcome

Judges can understand, access, test, and evaluate Clawback with minimal friction.

## Required Reading

- `AGENTS.md`
- All core documents
- All prior milestone completion records
- `docs/BUILD_LOG.md`

## In Scope

- Final README
- Public or correctly shared repository
- Setup instructions
- Sample data
- Judge testing instructions
- Public web URL
- Under-three-minute demo video
- Voiceover explaining Codex and GPT-5.6
- Project description
- Technology list
- Screenshots
- Architecture diagram
- Codex `/feedback` Session ID
- Secret and license audit
- Final regression testing
- Devpost submission fields

## Out of Scope

- New major features
- Architecture rewrites
- Last-minute third-party integrations
- Unverified claims
- Automatic cancellation claims

## Submission Story

The submission should communicate:

1. Real financial friction
2. Clear target audience
3. Distinctive swipe-to-strike interaction
4. Trustworthy GPT-5.6 extraction
5. User control through review-before-save
6. Meaningful Codex development workflow
7. Measurable value through money available, at risk, and protected

## Demo Video Outline

### 0:00–0:20 — Problem and Dashboard

Explain the financial leakage problem and show summary metrics.

### 0:20–1:15 — AI Workflow

Paste a realistic trial email, show GPT-5.6 extraction, review the fields, and save.

### 1:15–1:50 — Action and Strike

Show the urgent task, open the action link, strike it complete, and show totals update.

### 1:50–2:25 — Product Breadth

Show perk tracking, manual entry, and responsive web or iOS views.

### 2:25–2:55 — Technical Story

Explain:

- Codex built and tested major milestones
- GPT-5.6 runs in a Supabase Edge Function
- Structured outputs and review protect trust
- Expo provides mobile and web access

Leave a small buffer under three minutes.

## Acceptance Criteria

1. Repository URL is accessible to judges.
2. README setup steps work from a clean clone.
3. Sample data or demo mode is available.
4. Public web URL works.
5. Video is public and under three minutes.
6. Video includes audio explaining Codex and GPT-5.6.
7. `/feedback` Session ID is recorded.
8. Project description is accurate.
9. Built-with list is complete.
10. Screenshots show the strongest product moments.
11. No secrets exist in the repository or history.
12. Required private-repository access is granted if applicable.
13. License status is clear.
14. Final type-check, lint, test, and web build pass.
15. The submitted product matches all claims.

## Suggested Implementation Tasks

1. Freeze feature scope.
2. Run full regression.
3. Audit secrets and repository history.
4. Finalize README.
5. Finalize architecture and build log.
6. Deploy final web build.
7. Record demo video.
8. Capture screenshots.
9. Generate `/feedback` Session ID.
10. Complete Devpost fields.
11. Verify links and access.
12. Submit and confirm status.

## Verification

```bash
npm ci
npm run typecheck
npm run lint
npm test
npx expo export --platform web
```

Manual checks:

1. Clone into a clean directory.
2. Follow README exactly.
3. Test the public URL in an incognito window.
4. Play the complete video with audio.
5. Verify repository permissions.
6. Search for secrets.
7. Confirm every submission claim is demonstrable.

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
