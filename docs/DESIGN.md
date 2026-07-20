# Clawback Product Design Specification

## 1. Design Intent

Clawback should make financial housekeeping feel controlled, clear, and satisfying.

The product must balance two qualities:

- **Trust:** users are managing money, deadlines, and subscriptions
- **Momentum:** completing tasks should feel fast and rewarding

The experience should feel polished and slightly playful, but never childish, alarmist, or casino-like.

## 2. Brand Personality

Clawback is:

- Sharp
- Calm
- Financially literate
- Encouraging
- Direct
- Slightly witty
- Respectful of user control

Clawback is not:

- Fear-driven
- Overly cute
- Aggressive
- Judgmental
- Automated beyond user consent
- Filled with financial jargon

## 3. Voice and Tone

Preferred language:

- "Available"
- "At risk"
- "Due soon"
- "Ready to strike"
- "Protected"
- "Clawed back"
- "Review before saving"
- "Open action page"

Avoid:

- "Guaranteed savings"
- "We canceled it for you" unless the application truly did
- "You lost money"
- "Urgent!" for routine deadlines
- Shame-based messages

Example completion copy:

> Nice strike. You protected $595 from a potential renewal.

Example uncertainty copy:

> Clawback found a likely cancellation date. Review it before saving.

## 4. Provisional Visual Direction

The color system is provisional and may be adjusted after the first visual review.

### Neutral Foundation

- Background: near-white or soft cool gray
- Primary text: deep charcoal
- Secondary text: medium slate
- Borders: light neutral gray

### Semantic Accents

- Positive/protected: green or teal
- Available benefit: blue or violet
- Upcoming attention: amber
- High risk: warm red
- Completed/struck: muted neutral with positive confirmation

Color must not be the only urgency indicator.

## 5. Typography

Use a clean system or Expo-compatible sans-serif.

Hierarchy:

- Display total: large, confident, compact
- Page title: prominent but not oversized
- Card title: medium-to-semibold
- Supporting metadata: smaller and muted
- Labels: concise and legible
- Monetary amounts: tabular numerals where supported

Avoid decorative typefaces during the MVP.

## 6. Spacing and Shape

- Use generous screen margins.
- Use consistent spacing increments.
- Task cards should have rounded corners but not appear toy-like.
- Summary cards should be visually distinct but compact.
- Keep dense financial details grouped and aligned.
- Prefer one strong primary action per screen.

## 7. Navigation

Recommended primary navigation:

### Home

Active tasks, summary metrics, and Add action.

### Activity

Completed and expired tasks.

A prominent Add action may live in the tab bar, header, or floating position depending on Expo Router implementation.

Avoid adding more than three primary navigation destinations during the MVP.

## 8. Screen Inventory

### Onboarding or Demo Entry

Purpose:

- Explain Clawback in one sentence
- Offer demo mode
- Offer sign-in only when authentication is ready

Required copy concepts:

- Track perks
- Catch trial deadlines
- Strike tasks before money disappears

Checkpoint 6A implements this as a compact, nonblocking Home panel rather than
a separate onboarding route. It appears only when the fully loaded collection
matches the current canonical seed set and the user has not successfully
created or completed a task during the mounted application session. The
session marker is transient and is not stored. Undo does not make the panel
reappear; only the explicit Local-demo reset planned for Checkpoint 6B may
restore the seeds and clear the marker together.

The panel has one secondary Add link and states that Clawback tracks actions
but does not cancel or redeem automatically. Loading, error, empty, and partial
seed states are not first-run states.

### Home Dashboard

Required areas:

1. Header and identity
2. Summary metrics
3. Task list
4. Add action
5. Empty state when no active tasks exist

### Add Menu

Options:

- Parse an email
- Add a perk
- Add a trial
- Add a subscription

### Email Input

Required:

- Multiline input
- Privacy explanation
- Parse action
- Loading state
- Manual-entry fallback

### Extraction Review

Required:

- Provider
- Title
- Type
- Value
- Charge at risk
- Deadline
- Recurrence
- Action URL
- Confidence or warning state
- Save task action

### Manual Entry

Required:

- Type
- Title
- Deadline
- Optional value fields
- Optional provider
- Optional recurrence
- Optional action URL

### Task Detail

Required:

- Full task context
- Financial amount
- Deadline
- Action link
- Source
- Complete control

### Activity

Required:

- Completed tasks
- Completion date
- Amount protected or reclaimed
- Empty state

## 9. Dashboard Metrics

Display three metrics:

### Available

Benefit value remaining in active perk tasks.

### At Risk

Potential charges in active trial and subscription tasks.

### Clawed Back

Value associated with completed tasks.

Metric cards should include explanatory microcopy or an information affordance so users understand the difference.

## 10. Financial Item Card Anatomy

Each card should include:

1. Provider or category icon
2. Task title
3. Provider name
4. Primary financial amount
5. Deadline label
6. Urgency indicator
7. Optional recurrence
8. Action affordance
9. Completion affordance

Example:

```text
FoundersCard
Cancel free trial

$595 at risk
Due in 3 days

[Open action]          [Complete]
```

Do not overload the card with every field. Put secondary details in the task-detail screen.

## 11. Urgency Presentation

Suggested states:

### Comfortable

- More than 14 days remaining
- Label: "Due in 21 days"

### Upcoming

- 8 to 14 days
- Label: "Coming up"

### Soon

- 3 to 7 days
- Label: "Due in 4 days"

### Critical

- 0 to 2 days
- Label: "Due tomorrow" or "Due today"

### Overdue or Expired

- Deadline passed
- Label: "Deadline passed"
- Do not silently remove the item

Every urgency state must use text or iconography in addition to color.

## 12. Swipe-to-Strike

### Purpose

Create a distinctive, satisfying completion interaction without hiding accessibility or control.

### Behavior

- Preferred direction: left to right
- Card follows the user's gesture
- A strike or claw affordance appears beneath the card
- Before threshold, releasing returns the card
- At threshold, the completion state activates
- Completion triggers subtle haptic feedback on supported devices
- The card transitions into a struck or completed state
- A toast or snackbar offers Undo

### Threshold

Use a threshold that avoids accidental completion. Approximately 55% to 65% of card width is a reasonable initial range and should be tuned through testing.

### Visual Feedback

As the user swipes:

- Increase visibility of the completion affordance
- Optionally reveal a diagonal claw line or strike treatment
- Avoid excessive particle effects
- Preserve readable text until commitment

### Accessibility and Web

- Provide a visible Complete button
- Support keyboard activation on web
- Announce completion to assistive technology where practical
- Disable or simplify motion when reduced motion is requested
- Do not require haptics

## 13. Completion Feedback

Completion should communicate:

- What was completed
- What amount was protected or reclaimed
- That the user can undo

Example:

> Struck. $7 moved to your clawed-back total.

For trial or subscription items:

> Struck. You protected $149 from a potential charge.

Do not use confetti by default. A restrained visual reward is more appropriate.

## 14. AI Review Design

The AI review screen is a trust-critical screen.

### Requirements

- Clearly label the result as an extraction
- Make fields editable
- Show uncertainty near the affected field
- Explain that saving creates a reminder, not a cancellation
- Highlight missing required values
- Display action-link domain when present

### Confidence

Avoid a raw percentage as the only signal.

Preferred states:

- High confidence
- Review recommended
- Missing information

A raw confidence value may appear in developer or demo details, but the user-facing experience should be understandable without it.

## 15. Empty States

### No Active Tasks

Message:

> Nothing is slipping through the cracks.

Actions:

- Parse an email
- Add a perk
- Load demo tasks

### No Completed Tasks

Message:

> Your first strike will show up here.

### AI Could Not Parse

Message:

> Clawback could not confidently turn this email into a task.

Actions:

- Try again
- Edit the text
- Add manually

## 16. Loading States

Use specific language rather than generic spinners.

Examples:

- "Finding the provider..."
- "Looking for the charge..."
- "Checking the deadline..."
- "Preparing your review..."

Do not fake a fixed sequence if the implementation does not actually provide progress. A single clear loading message is acceptable.

## 17. Error States

Error messages must:

- State what failed
- Avoid blaming the user
- Preserve entered data
- Offer a next action
- Avoid leaking technical details

Example:

> We could not reach the email parser. Your text is still here, so you can retry or create the task manually.

## 18. Responsive Web Behavior

At narrow widths:

- Use a single-column layout
- Preserve mobile card behavior
- Show visible completion buttons
- Keep Add action reachable

At wider widths:

- Center content within a maximum width
- Allow summary metrics to appear in a row
- Avoid stretching task cards across the entire viewport
- Use hover and focus states
- Ensure keyboard navigation

Dashboard metrics use content-driven flex wrapping rather than JavaScript
viewport state. Very narrow and zoom-constrained layouts may use one column.
Typical phone widths may pair Available and At Risk while placing Clawed Back
on the next row. Medium and wide layouts may show three equal cards. Readable
content and no horizontal overflow take precedence over retaining any specific
column count.

The web version should feel intentionally designed, not merely stretched mobile UI.

## 19. Accessibility

- Minimum practical touch target: approximately 44 by 44 points
- Visible keyboard focus on web
- Semantic labels for amounts and deadlines
- Logical reading order
- Contrast suitable for text and controls
- Color-independent urgency
- Button alternative for swipe
- Reduced-motion support where feasible
- Error messages associated with fields

## 20. Demo Data Design

Seeded tasks should demonstrate multiple product concepts:

### FoundersCard Trial

- Large potential charge
- Near-term deadline
- Trial type
- Action URL

### Amex Gold Dunkin' Credit

- Small monthly benefit
- Perk type
- Monthly recurrence

### Hilton Aspire Airline Benefit

- Larger benefit
- Quarterly deadline
- Perk type

All demo deadlines must be future-relative or generated at runtime.

## 21. Design Acceptance Criteria

The MVP design is successful when:

- The product is understandable without narration
- Financial amounts and deadlines are easy to scan
- The most urgent task is visually obvious
- Completion feels satisfying
- The AI review screen feels trustworthy
- Mobile and web both appear intentional
- Swipe is never the only way to complete a task
