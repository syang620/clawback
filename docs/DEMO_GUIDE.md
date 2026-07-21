# Clawback Judge and Video Guide

## Public Demo

Production URL:
[https://clawback-app-ai.netlify.app](https://clawback-app-ai.netlify.app)

Open it in a fresh private or incognito browser window for a clean Connected
session.

Final owner acceptance on 2026-07-20 passed private-browser Connected
initialization, rendered extraction through editable review, mandatory explicit
Save, persistence after refresh, completion, Undo, and browser-console review
with no serious application errors observed.

Connected records persist only for that anonymous browser session. A different
private session receives a separate anonymous identity; the original records
remain unchanged and are unavailable from the new session.

## Judge Walkthrough

1. Read the Home explanation and the Available, At Risk, and Clawed Back
   metrics.
2. Open a seeded task and review its deadline, amount, and external-action
   destination.
3. Add one task manually.
4. From Add, choose email extraction and paste the synthetic message below.
5. Review every GPT-5.6 field and explicitly choose Save.
6. Refresh the page and confirm the saved task persists.
7. Open the validated external action page, perform no automatic action, and
   return to Clawback.
8. Complete the task, review the metric and Activity update, then Undo.

## Synthetic Email for the Demo

This message is synthetic, non-sensitive, and safe to use in a recording:

```text
Subject: Your Northstar Plus trial ends soon

Your Northstar Plus trial ends on August 15, 2026. Unless you cancel before
then, your annual plan will renew for $79.00. Manage the trial at
https://example.com/account/trial.
```

Clawback sends the pasted message to the hosted GPT-5.6 extraction function for
this explicit request. The raw email and raw model output are not persisted.
Review and explicit Save remain mandatory.

## Video Run Sheet

- **0:00–0:20 — Problem and dashboard:** explain missed trials, renewals, and
  unused perks while showing the three financial metrics.
- **0:20–1:15 — GPT-5.6 workflow:** paste the synthetic email, extract, review,
  and explicitly Save.
- **1:15–1:50 — Act and strike:** show the validated external destination,
  return, Complete, and show the metric and Activity update.
- **1:50–2:25 — Breadth:** Undo, show a perk, and briefly show manual entry.
- **2:25–2:50 — Technical story:** explain that Codex supported implementation
  and verification, GPT-5.6 runs through a Supabase Edge Function, structured
  output is validated, and users retain control through review-before-save.

Keep the final recording below three minutes. Clawback tracks actions; it does
not cancel, redeem, purchase, or contact a provider for the user.

## Recording Preflight

- Use the final HTTPS production URL in a new private browser window.
- Confirm the canonical tasks load before recording.
- Keep the synthetic message ready to paste without showing credentials.
- Reset browser zoom, hide bookmarks and unrelated tabs, and disable
  notifications.
- Check microphone level and record a short audio sample.
- Keep Supabase, OpenAI, Netlify, terminal, and environment dashboards out of
  frame.
- Inspect the browser console before the take, then close developer tools.
- If a clean restart is needed, open a new private session; do not delete
  Connected records.
