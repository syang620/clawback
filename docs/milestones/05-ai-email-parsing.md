# Milestone 05 — GPT-5.6 Email Parsing

## Objective

Implement the end-to-end pasted-email workflow using GPT-5.6 through a Supabase Edge Function.

## User-Visible Outcome

A user can paste a financial email, receive a structured draft, review and edit it, and save a trustworthy financial task.

## Required Reading

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN.md`
- `docs/AI_PIPELINE.md`
- `docs/milestones/04-supabase.md`

## In Scope

- Email input screen
- Privacy and trust explanation
- Supabase Edge Function
- OpenAI Responses API
- GPT-5.6
- Strict structured output
- Prompt-injection resistance
- Runtime validation
- Date normalization
- Confidence and warnings
- Evidence snippets
- Review-before-save form
- Retry and manual fallback
- Curated test fixtures
- Build log documentation

## Out of Scope

- Gmail OAuth
- Full inbox scanning
- Attachment parsing
- Web browsing for cancellation links
- Automatic cancellation
- Merchant login
- Background queue
- Persisting raw emails by default

## Acceptance Criteria

1. OpenAI requests run only server-side.
2. The API key is absent from the client bundle.
3. The parser accepts pasted email text.
4. The result follows the documented schema.
5. Missing values return null rather than guesses.
6. URLs are never invented.
7. Prompt-injection text is ignored.
8. Ambiguous dates generate warnings.
9. The user can edit every important field.
10. Saving creates a normal financial item.
11. The UI states that saving does not cancel anything.
12. Failure preserves the pasted text.
13. Manual entry remains available.
14. Curated fixtures cover trials, perks, ambiguity, and malicious instructions.
15. Type-checking, linting, and tests pass.

## Suggested Implementation Tasks

1. Define shared request and response schemas.
2. Implement the Edge Function.
3. Write the trusted model instructions.
4. Add runtime validation and normalization.
5. Add email input screen.
6. Add parser service.
7. Add loading and error behavior.
8. Add extraction review screen.
9. Save confirmed task.
10. Add fixture tests.
11. Verify no secrets or raw emails are logged.
12. Update documentation and build log.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npx expo export --platform web
```

Edge Function checks should include local invocation or deployed test calls.

Manual checks:

1. Parse a clear trial email.
2. Parse a monthly credit email.
3. Parse a quarterly benefit email.
4. Parse an email with conflicting dates.
5. Parse an email containing prompt injection.
6. Parse an email with no URL.
7. Simulate network failure.
8. Edit the result and save.

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
