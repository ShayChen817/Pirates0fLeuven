# Copy this prompt into Claude Code

You own the **frontend** of Pirates0fLeuven. Opus and Codex are now authorised to develop in parallel. Codex owns the **backend decision engine, shared services, signal recognition, tests and AI explanation prompts**. Backend stages 1 and 2 have landed: use [BACKEND.md](BACKEND.md) to connect `createMomentsService()` and `createSavingService()`. Moving v1 is unchanged; Saving has its own implemented `saving-1.0` types. Recognition is available through `createRecognitionService()` and approved explanations through `lib/explain.ts`. Do not duplicate calculation logic in the UI.

Current integration priority: import the two real services, replace their respective adapters, keep one instance of each per session, adopt returned snapshots on success and errors, and verify both journeys. Run `node scripts/backend-check.mjs` for backend checks; own the Next.js build and browser flow.

Repository: https://github.com/ShayChen817/Pirates0fLeuven

Direction source: PR #1, including `0a4df0d`, is integrated into the current README. **Profile is the core of personalisation; Saving and Moving demonstrate it.** Read the Profile-first section as the current brief. The Profile service and bio interpretation are not implemented yet; do not import invented exports or mutate financial facts from bio text.

## Current Profile priority

Design the first customer journey around an editable structured goal, optional bio, and a review of interpreted preferences. Display what is explicitly stated, inferred, or confirmed. Include correction, deletion, loading, failure, no-match and paused states. Keep raw bio text out of the existing explanation provider. No open-ended chat is needed.

Codex owns the upcoming Profile contract, revision handling, interpretation prompt and ranking. Until that contract lands, any Profile UI must be clearly labelled as a local preview under `components/demo/`; do not present it as backend-connected. Existing goal edits should use Saving's `UPDATE_GOAL`. Connect the shipped domain services now and retain separate snapshots/revisions.

The acceptance story is: bio asks for subscription help → review and confirm the preference → show matching recurring-charge evidence → customer selects the unused service → add intention → projected date changes while actual savings stay €650. A coffee-only preference must not be labelled as matching streaming advice. Editing the bio discards old pending interpretations. Home and Kate must reflect the same correction.

## Read first and use our skills branch

Read `AGENTS.md`, `README.md`, `docs/CHALLENGE.md`, `docs/PLAN.md`, `docs/CONTRACT.md`, `docs/BACKEND.md`, `docs/DESIGN.md`, `lib/types.ts`, `lib/saving-types.ts`, `lib/recognition-types.ts` and their fixtures.

Fetch the `skills` branch and read the actual files using Git, without switching away from your implementation branch:

```sh
git fetch origin
git show origin/skills:skills/rapid-planning/SKILL.md
git show origin/skills:skills/frontend-design/SKILL.md
git show origin/skills:skills/kbc-design/SKILL.md
git show origin/skills:skills/verification/SKILL.md
git show origin/skills:skills/demo-verification/SKILL.md
```

Use `systematic-debugging` from the same branch if something fails. Tell the user which skills you are applying. Current README, contract and fixtures override old illustrative figures in skills: use €7,850 balance, €2,850 potentially available, €2,500 moving commitment, €350 remaining, and an alternate €1,500 simulation. Do not copy unsubstantiated fee, suitability or financial-safety claims from example design copy.

For the Saving journey, use the exact Japan example below. Do not copy the proposal branch's unverified “five weeks sooner”, “no prompt injection” or investment-funded short-term goal claims.

## Ownership: prevent concurrent edits

- You own `app/`, `components/`, `public/`, frontend configuration, `package.json`, lockfile, Next.js/TypeScript/Tailwind setup, `.gitignore` additions needed for frontend builds, and `docs/FRONTEND.md`.
- Codex owns `lib/`, `data/`, `prompts/`, `tests/backend/`, `scripts/backend-*`, backend documentation, `docs/PLAN.md`, `docs/CONTRACT.md` and README updates.
- Do not edit Codex-owned files, duplicate the engine in the frontend, or change the shared contract. Put temporary fixture UI adapters under `components/demo/`, mark them `// DEMO:`, and remove/replace them at integration.
- Prefer your own checkout/branch if another agent uses the same folder. Do not reset, overwrite or stash another person's edits. Before pushing, fetch and rebase your commits on `origin/main`; preserve teammates' code. The user wants completed work committed and pushed to GitHub, not left locally.

## Product and scope

Build an English, KBC-inspired **Profile-driven Life Goals** experience. The customer's explicit goal is the hero: target, actual progress, deadline and one useful next action. **Saving** is the new goal-centred journey; **Moving** remains the existing contract-backed mission, with a shared plan and Tell Once. Products are supporting actions. Use Next.js, TypeScript and Tailwind. No real KBC logo, authentication, database, payments, subscription cancellation, external policy purchase or provider notifications.

Kate uses **advice cards, structured forms and quick replies**. A Kate tab may show the guided history of those cards, but do not build an open-ended model-chat input. Structured input fields for goal amount/date are allowed. All core screens must work without model calls. Do not advertise the design as immune to prompt injection or security problems.

Implementation is authorised. The shell and fixture/preview journeys have landed. Next: connect the shipped services, prepare the Profile input/confirmation flow, then integrate the Profile contract when delivered. Prioritise the Profile-to-Saving demonstration; Moving remains the reuse example and fallback.

Prioritise a working continuous demo over extra screens. Optional voice and speculative mission recognition must never block the core journey. A purchase/location display must clearly identify synthetic data; no browser geolocation permission request is needed for this demo.

## Goals-first home and Saving journey

Home must make the selected goal visually dominant. Provide a simple demo selector for **Japan savings** and **Moving**. They are independent synthetic scenarios, not simultaneous allocations of one balance. Avoid presenting a product catalogue as the main screen.

Use `createSavingService()` from `lib/saving.ts` with types from `lib/saving-types.ts` and the seed in `data/saving-fixtures.ts`. Read the event examples in `docs/BACKEND.md`. Display a synthetic-demo label. Do not cast Saving data into v1 `Snapshot`, invent a `saving` RuleId, or duplicate projection logic in the UI.

Use these exact synthetic values:

| Field | Value |
|---|---|
| Demo date | 2026-10-01 |
| Goal | €2,000 for Japan by 2027-08-01 |
| Actually saved | €650 (32.5% of target) |
| Remaining gap | €1,350 |
| Contributions | €125 on the first of each month, starting 2026-11-01 |
| Synthetic monthly subscriptions | Stream A €13; Stream B €15; Stream C €10 |
| Baseline projection | 11 contributions, completion 2027-09-01 |
| Potential change after customer identifies Stream A | Redirect €13/month; planned contribution becomes €138 |
| Revised projection | 10 contributions, completion 2027-08-01 |

Service-backed sequence:

1. Show Japan target, saved amount, deadline and one Kate card: “You have three recurring streaming charges totalling €38/month. Is there one you no longer use?”
2. Evidence drawer lists synthetic recurring charges. Let the customer identify Stream A; never label it unused merely from the transaction pattern.
3. Show the conditional comparison: €125 → €138 planned per month; September → August projected finish, assuming the charge stops and that amount is redirected, with zero interest and uninterrupted contributions.
4. **Add to my plan** records a saving intention. Keep saved amount €650 and progress 32.5%. Display “Planned; subscription not cancelled.” Do not animate the saved balance upward.
5. **Keep this service**, **Not now**, **Why this?**, and reset have clear outcomes through the Saving service. No provider is contacted. No new suggestion should immediately replace a dismissed one after dismissal.

Do not attribute guaranteed savings, service overlap or external product prices to transaction data. No live scraping or receipt recognition. Lifestyle preferences are future customer opt-ins, not inferred facts; omit lifestyle settings that do not serve the demo.

The Japan deadline is near-term. Do not show the €1,500 investment suggestion in this scenario, count investment principal twice, or assume investment returns will close its gap. The investment simulation belongs only to the existing separate long-term scenario.

## Existing v1 Moving journey

1. Home shows Shay's account and one relevant Kate action. The initial candidate asks about plans; it is not an approved investment recommendation.
2. “I'm moving” opens a form prefilled with synthetic remaining cost €2,500 and date 2026-11-01. Confirmation sends the typed `CONFIRM_MOVING` event.
3. Home becomes **Your move**, with a step-by-step plan and €350 potentially available. Acknowledge the reserve through `ACKNOWLEDGE_RESERVE`; no money moves.
4. Show the existing-cover question. “Already insured elsewhere” sends `REPORT_COVERAGE`. The step closes in both home and Kate without asking twice.
5. **What Kate knows / Why this suggestion?** displays evidence provenance and lets the customer clear the supported context fields, dismiss actions and pause/resume suggestions.
6. An engine panel displays the shared decision trace with selected/deferred/suppressed reasons in human language.
7. Reset starts the demo again. An alternate long-term path sends `CONFIRM_LONG_TERM` with seven years and no additional commitments, followed by an adjustable investment simulation. Label confirmation as simulation throughout.

Coverage need is an informational acknowledgement, not a real adviser contact. No primary action is a normal quiet state. Fixed demo date is 2026-10-01; do not reject fixtures because of today's real date.

## Shared API: stable integration boundary

Import the types from `lib/types.ts`. `MomentsService` has:

```ts
getSnapshot(): Promise<Snapshot>
dispatch({ expectedRevision, event }): Promise<DispatchResult>
```

The implemented Moving entry point is:

```ts
import { createMomentsService } from '@/lib/service';
const service = createMomentsService();
```

Create one instance per mounted demo session in a provider above home/Kate/engine views. Do not create a process-wide singleton or a new service on every render. In this synthetic-only MVP the same pure core can run locally in the provider; this does not claim to secure real banking transactions. A future server transport preserves the interface.

`demoTransitions` documents the exact Moving happy-path event requests. Fixtures are reference expectations; the running UI must dispatch to the services. Saving has its own snapshot, revision and events. Reset each scenario through its service; do not mix balances or revisions.

Find the primary action with `snapshot.actions.find(a => a.id === snapshot.decision.primaryActionId)`. Use returned text and amounts. Format integer cents as EUR; do not recompute financial eligibility in UI code. Derive mission progress from shared actions/context, not separate page state. The service owns rules, revisions and completion.

Serialize dispatches, disable pending controls, and replace the provider snapshot with the returned authoritative snapshot on both success and domain error. Surface the error message and require review; never automatically retry confirmation. Reject stale local confirmations gracefully. Treat snapshots as immutable.

## Design and accessibility

Follow `frontend-design` and `kbc-design`: navy/sky tokens, clear type hierarchy, one primary action, short Kate copy, realistic content and consistent spacing. Phone-sized presentation on desktop, usable at mobile width and projector zoom. Use text labels with icons, semantic controls, focus states, labelled inputs and accessible error feedback. Handle loading, empty/quiet, error and success states.

Make the customer's goal visually obvious. In Saving, distinguish the actual-progress bar from a projected-date comparison. In Moving, the home becomes a coherent plan after confirmation. Use a compact timeline/evidence drawer rather than a wall of unrelated cards. If remote font loading breaks a build, use a system-font fallback and record it.

## Optional recognition and voice

After core integration, use `createRecognitionService()` from `lib/recognition.ts` and the separate `recognition-1.0` types. Render its tentative hypothesis and synthetic evidence; location is off by default. Send `SET_SOURCES` and `RECORD_FEEDBACK` using the exact typed payloads. A confirmed hypothesis opens the Moving details form; it does not create a financial commitment. Only the customer's separate `CONFIRM_MOVING` submission does that. Do not infer item-level purchases, pregnancy or other sensitive characteristics. Saving needs no location.

Use the envelope builders and `explain()` from `lib/explain.ts` for Kate text. Templates work without a provider. If adding an asynchronous provider later, discard responses whose revision/action ID no longer matches the displayed snapshot. API keys and provider calls belong on the server. Never let generated text change an action, amount or eligibility decision.

Voice is secondary: show a text fallback and user-initiated playback only if an implementation is available. Never expose API keys in client code. Do not delay the primary demo to integrate ElevenLabs.

## Verify and deliver

Run the app, build/typecheck, and click through the primary journey and reset. Check that home and Kate stay consistent, amounts are correct and stale/error states do not show false success. Use the skills branch's verification and demo-verification workflows, reporting checks you could not perform.

For Saving, verify separately that accepting a plan leaves €650 and 32.5% unchanged, projection dates match the fixed contribution schedule, keeping a subscription does not count savings, and the synthetic-demo label remains visible. For Moving, preserve all existing event payloads and amounts. Report whether each visible flow is connected to its service, and never count projected savings as achieved financial benefit.

Write `docs/FRONTEND.md` with run commands, integration status and remaining limitations. Commit only your files, fetch/rebase before pushing, and push completed work. Report the commit and any concrete backend mismatch. Do not claim a fixture-only UI is connected to the real engine.
