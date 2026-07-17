# Clawback Product Requirements

## 1. Product Summary

Clawback is a consumer-focused financial housekeeping application that helps people avoid losing money through forgotten trial cancellations, unused credit-card perks, subscription renewals, and other deadline-driven financial tasks.

The product turns fragmented financial obligations into a clear, prioritized action list. GPT-5.6 helps convert unstructured emails into structured tasks. Users retain control by reviewing extracted details before anything is saved.

The signature interaction is **swipe-to-strike**: a user completes a task, strikes it out, and sees the amount of money protected or reclaimed.

## 2. Problem

Money-smart consumers often manage multiple credit cards, subscriptions, trials, and promotional benefits. The relevant deadlines are scattered across emails, account portals, calendar reminders, and memory.

Common failures include:

- Forgetting to cancel a free trial before it converts to a paid plan
- Forgetting to use a monthly statement credit
- Missing a quarterly or annual benefit deadline
- Failing to act on a renewal notice
- Knowing a perk exists but not knowing when or how to use it
- Creating reminders that lack the correct amount, action link, or context

Existing reminder tools can store dates, but they do not understand financial meaning, estimate value at risk, or create a satisfying completion loop.

## 3. Target Audience

### Primary Audience

Money-smart individuals who:

- Hold multiple rewards credit cards
- Use free trials and subscription services
- Care about maximizing financial benefits
- Prefer control and review over fully automatic financial actions
- Want a lightweight alternative to spreadsheets and generic reminders

### Secondary Audience

- Frequent travelers managing travel credits
- Household financial organizers
- Subscription-heavy consumers
- Rewards enthusiasts
- Users who want to reduce recurring financial leakage

## 4. Core Value Proposition

Clawback helps users reclaim potential financial losses by turning messy financial communications into prioritized, actionable tasks.

The application should answer four questions quickly:

1. What money is available?
2. What money is at risk?
3. What should I do next?
4. How much have I already protected or reclaimed?

## 5. Product Principles

### User Control

Clawback assists with detection, organization, and action. It does not silently perform financial actions.

### Financial Clarity

Every task should communicate the relevant amount, deadline, provider, and next action.

### Low Friction

A user should be able to create a useful task manually or from pasted email text in under one minute.

### Satisfying Completion

Completing a task should feel rewarding without making the product feel childish or casino-like.

### Trustworthy AI

AI extraction must be reviewable, editable, and explicit about uncertainty.

### Demo Reliability

The MVP must remain testable with seeded data even when external services are unavailable.

## 6. Core Product Loop

```text
Add an obligation
→ extract or enter value and deadline
→ review details
→ rank by urgency
→ take action
→ strike complete
→ update reclaimed totals
```

## 7. Main Use Cases

### Trial Cancellation

A user pastes an email confirming a free trial. Clawback extracts the vendor, expected charge, exact cancellation deadline, and action link. The user confirms the data and later completes the cancellation task.

Example:

- Provider: FoundersCard
- Task: Cancel free trial
- Charge at risk: $595
- Deadline: Future date before renewal
- Action: Open cancellation page

### Credit-Card Perk

A user manually creates or imports a recurring benefit.

Example:

- Provider: American Express Gold
- Task: Use monthly Dunkin' credit
- Value available: $7
- Deadline: End of current month
- Recurrence: Monthly

### Quarterly Benefit

A user tracks a benefit that resets quarterly.

Example:

- Provider: Hilton Honors American Express Aspire
- Task: Use airline benefit
- Value available: $50
- Deadline: End of quarter
- Recurrence: Quarterly

### Subscription Renewal

A user tracks a renewal that may or may not be canceled.

Example:

- Provider: Streaming service
- Task: Review annual renewal
- Charge at risk: $149
- Deadline: Three days before renewal
- Action: Open account settings

## 8. MVP User Journey

### First Launch

The user sees a short introduction and can enter demo mode without creating an account.

The dashboard contains realistic sample tasks that immediately communicate the product.

### Dashboard

The user sees:

- Available value
- Money at risk
- Money clawed back
- Active tasks ranked by urgency
- Clear task types and deadlines
- A prominent Add action

### Add Task

The user chooses:

- Parse an email
- Add a perk manually
- Add a trial manually
- Add a subscription manually

### Parse Email

The user pastes an email body.

Clawback:

1. Sends the text to a server-side parser.
2. Displays a loading state.
3. Returns structured fields.
4. Highlights uncertainty.
5. Requires review before saving.

### Review Extraction

The user can edit:

- Title
- Provider
- Task type
- Value
- Charge at risk
- Deadline
- Recurrence
- Action URL

The user confirms and creates the task.

### Complete Task

The user can:

- Open the action link
- Swipe the task to complete it
- Use a visible Complete button
- Undo completion briefly

The reclaimed total updates after completion.

## 9. Functional Requirements

### Dashboard

The dashboard must:

- Display summary totals derived from task data
- Separate available value from charge exposure
- Rank active tasks by urgency and financial importance
- Show a clear empty state
- Support seeded demo data
- Remain understandable at mobile and desktop widths

### Financial Items

The system must support:

- Trial
- Perk
- Subscription

Each item may include:

- Provider
- Title
- Value available
- Charge at risk
- Deadline
- Recurrence
- Action URL
- Status
- Source
- Confidence

### Manual Creation

A user must be able to create a task without AI.

Required minimum fields:

- Title
- Type
- Deadline

Optional fields:

- Provider
- Value available
- Charge at risk
- Recurrence
- Action URL
- Notes

### AI Parsing

The AI flow must:

- Accept pasted email text
- Return only supported structured fields
- Handle missing information
- Display confidence or uncertainty
- Require user confirmation
- Never claim a cancellation was completed
- Never invent an action URL

### Completion

Completion must:

- Update status
- Record completion time
- Update relevant totals
- Provide Undo
- Work through swipe and button interactions
- Degrade safely on web and reduced-motion environments

### Task Details

The detail view should show:

- Provider and task title
- Financial value or exposure
- Deadline and urgency
- Recurrence
- Source
- Action link
- Completion control
- Edit control when implemented

## 10. Ranking Model

The MVP should rank tasks using a transparent heuristic.

Suggested factors:

- Days until deadline
- Charge at risk
- Value available
- Task type
- Completion status

A simple initial scoring model is acceptable:

```text
urgency score
= deadline proximity weight
+ financial impact weight
+ task-type weight
```

The ranking logic must be deterministic and covered by tests.

The UI does not need to expose the exact formula, but it should explain why a task is urgent through labels such as:

- Due today
- Due in 3 days
- High charge at risk
- Monthly benefit expiring soon

## 11. Summary Metrics

### Available

Unused benefit value associated with active perk tasks.

### At Risk

Potential charges associated with active trial and subscription tasks.

### Clawed Back

For the MVP, this is the value associated with completed tasks:

- Completed perk: add `valueCents`
- Completed trial or subscription cancellation: add `chargeAmountCents`

The UI should avoid implying that money was literally deposited into the user's account. Supporting text may say "protected or reclaimed."

## 12. Empty, Loading, and Error States

### Empty Dashboard

Explain the value proposition and provide actions to:

- Parse an email
- Add a perk
- Load demo data

### AI Loading

Show that Clawback is identifying:

- Provider
- Deadline
- Financial value
- Action path

Do not display fake certainty.

### AI Error

Offer:

- Retry
- Edit the email text
- Create the task manually

### Missing Date

The user must provide or confirm a deadline before saving an actionable task.

### Invalid URL

Do not open malformed or unsafe URLs. Allow the user to edit or remove the URL.

### Offline or Backend Failure

Manual task creation and seeded demo behavior should remain understandable. Display clear recovery messaging.

## 13. Accessibility Requirements

- Swipe completion must have a visible button alternative.
- Urgency cannot be communicated by color alone.
- Interactive controls need accessible labels.
- Text must remain readable at larger sizes where practical.
- Touch targets should be appropriately sized.
- Reduced-motion preferences should be respected where feasible.
- Focus order must be logical on web.

## 14. Privacy Expectations

- Do not require access to a user's full inbox for the MVP.
- Accept pasted email text.
- Minimize storage of raw email content.
- Explain when text is sent for AI processing.
- Never expose OpenAI credentials to the client.
- Do not log full email bodies in production-oriented paths.

## 15. MVP Non-Goals

The hackathon MVP will not include:

- Automatic cancellation
- Gmail OAuth
- Full inbox scanning
- Direct bank or card connections
- Automated benefit redemption
- Merchant scraping
- Comprehensive card-benefit catalog
- Household sharing
- Push notification infrastructure beyond a simple optional local reminder
- Billing
- App Store distribution
- Android-specific refinement
- Financial advice or recommendations

## 16. Success Criteria

The MVP is successful when a judge can:

1. Open the web demo without special setup.
2. Understand Clawback within 20 seconds.
3. See realistic financial tasks.
4. Paste an email and receive a structured extraction.
5. Review and save the extracted task.
6. Complete the task through swipe or button.
7. See the reclaimed total update.
8. Understand how GPT-5.6 and Codex were used.

## 17. Demo Narrative

The three-minute demonstration should show:

1. A dashboard with money available and at risk.
2. A pasted trial email.
3. GPT-5.6 extracting a provider, charge, deadline, and action URL.
4. The review-before-save screen.
5. The new task appearing as urgent.
6. The user opening the action and striking the task complete.
7. The clawed-back total increasing.
8. A brief architecture view explaining Codex and GPT-5.6.

## 18. Future Opportunities

After the hackathon, Clawback could add:

- Gmail and Outlook integrations
- Notification scheduling
- Card-benefit templates
- Household accounts
- Renewal negotiation workflows
- Receipt and statement parsing
- Benefit discovery
- Browser extension
- Verified cancellation workflows
- Financial leakage reports
