# Frontend — Life Goals with Kate

Opus owns `app/`, `components/`, `public/`, the Next.js/TypeScript/Tailwind configuration, `package.json` and its lockfile. Codex owns `lib/`, `data/`, `prompts/` and the backend tests. The frontend does not change the shared contract or re-implement decision logic.

## Run it

Requires Node.js 20+ (verified on Node 24.11, npm 11.6).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build + type check
npm run typecheck  # tsc --noEmit
```

No environment variables or API keys are needed. All data is synthetic and the fixed demo date is 1 October 2026.

## What you see

A KBC-inspired app inside a realistic iPhone frame. On screens narrower than 640 px the app fills the screen instead. Beside the phone:

- **Scenario switch**: *Japan savings* and *Moving*. These are two independent synthetic sessions, not one shared balance.
- **Reset**: sends `RESET_DEMO` to the active scenario's service.
- **Behind the scenes**: the decision trace (Moving) or the baseline vs. planned projection (Saving), shown for the judges.

Inside the phone there are three tabs: **Home** (goal first, one Kate card), **Kate** (a guided history of the same cards; no free-text chat) and **Profile** ("What Kate knows": the evidence and the customer's answers, with controls to correct or pause).

### Japan savings (`createSavingService`, saving-1.0)

1. Home shows the goal, the saved amount (€650 of €2,000, 32.5%) and the projected finish (September 2027, after the deadline).
2. Kate asks about three recurring streaming charges (€38/month). *Review the charges* opens the evidence sheet. The customer marks Stream A as no longer used (`REVIEW_SUBSCRIPTION`).
3. Kate offers €13/month towards the goal. The before/after preview uses `projectGoal` from `lib/saving`: €125 → €138 per month, September → August 2027.
4. *Add to my plan* (`ADD_SAVING_INTENTION`) changes only the projection. The card reads "Planned; subscription not cancelled." The saved amount stays €650 (32.5%).
5. *Keep it*, *Not now* (`SNOOZE_ADVICE`), *Remove from plan*, *Pause/Resume* and *Reset* each have a visible outcome. No new suggestion replaces a dismissed one.

### Moving (`createMomentsService`, v1)

1. Home shows €2,850 potentially available. Kate asks what the money is for.
2. *I'm moving* opens a form prefilled with €2,500 and 1 November 2026, which sends `CONFIRM_MOVING`. The hero counts down to €350, and the plan appears with four steps.
3. Acknowledging the reserve sends `ACKNOWLEDGE_RESERVE`; no money moves. Kate then asks about existing cover. *Already insured elsewhere* (`REPORT_COVERAGE`) closes the step on Home and in Kate, and it is not asked again.
4. Profile shows each signal's provenance, with *Clear* (`CLEAR_CONTEXT`) and *Pause/Resume* (`SET_PROACTIVE`) controls.
5. Alternate path: Reset → *No upcoming plans* sends `CONFIRM_LONG_TERM` (7 years). The adjustable simulation then sends `CONFIRM_SIMULATION` and is labelled a simulation throughout.

## Integration status

| Area | Status |
|---|---|
| Moving journey on `createMomentsService()` | Connected; one instance per mounted session |
| Saving journey on `createSavingService()` | Connected; local preview model removed |
| Shared provider behaviour | Serialized dispatch; pending control disabled; returned snapshot adopted on success **and** domain error; errors shown; no auto-retry |
| Recognition service (`lib/recognition.ts`) | Not integrated in the UI yet |
| Constrained explanations (`lib/explain.ts`) | Not integrated; the UI shows service-returned text only |
| Saving `UPDATE_GOAL` / `RECORD_CONTRIBUTION` | Not exposed in the UI |
| Profile / bio flow (README P0) | No backend contract yet; not built |
| Voice (ElevenLabs) | Not built |

## Verification

A headless-Chrome click-through (Playwright driving the installed Chrome) checks both journeys:
- The Saving amounts and dates are correct, and €650 / 32.5% stay unchanged after a plan.
- Keeping a service counts no saving.
- Moving goes €2,850 → €350, with the reserve and coverage steps.
- Home and Kate stay consistent, and the coverage question is not asked twice.
- Pause/Resume, Reset, and the long-term simulation (cash unchanged) all work.
- There is no horizontal scroll at 390 px, and no console errors.

The script lives outside the repo, so it is not a project test.

## Design

- **Tokens:** navy `#0d2a50` and blue `#0097db` from kbc.be; sky `#00aeef` and green `#80c342` from KBC's stylesheet. Neutrals are tinted towards the brand blue. Font: Albert Sans via `next/font` (system fallback).
- **Principles** (from the `kbc-design` / `frontend-design` skills and impeccable.style): one primary action per screen; no nested cards or side-stripe borders; few badges.
- **Motion:** 150 ms hover lift and 160 ms press scale; 380 ms staggered entrances; iOS-style sheets; amounts that count to their new value. All of it respects `prefers-reduced-motion`.

## Known limitations

- Session state lives in memory. A page reload starts a new demo session.
- Wording mismatches between the engine and the handoff (the UI shows the engine text as returned):
  - Saving says "You have **3** recurring streaming charges…", but the handoff specifies "three".
  - The Moving reserve title is "Plan for €2,500 of moving costs", but the fixtures use "Keep €2,500 available for your move".
  - A completed simulation keeps the title "Explore a long-term scenario".
- The investment simulation accepts amounts from €100 up to the available cash. Eligibility is checked by the engine, not the UI.
- This is not an accessibility audit. Controls have labels, focus rings and live error messages, but no screen-reader testing has been done.
