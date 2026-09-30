# Copy this prompt into Claude Code

You own the **frontend** of Pirates0fLeuven. Opus and Codex are now authorised to develop in parallel. Codex owns the **backend decision engine, shared services, signal recognition, tests and AI explanation prompts**. Backend stage 1 has landed: use [BACKEND.md](BACKEND.md) to connect `createMomentsService()` and `createSavingService()`. Moving v1 is unchanged; Saving has its own implemented `saving-1.0` types. The temporary-preview instructions below describe the earlier fallback and must be replaced by the real Saving service wherever available. Do not duplicate calculation logic in the UI.

Current integration priority: import the two real services, replace their respective adapters, keep one instance of each per session, adopt returned snapshots on success and errors, and verify both journeys. Run `node scripts/backend-check.mjs` for backend checks; own the Next.js build and browser flow.

Repository: https://github.com/ShayChen817/Pirates0fLeuven

Direction source: the `goals-saving-direction` proposal at `bc3cf2f`, now integrated and clarified in the `main` README. Read current `main` as the product brief; do not overwrite it with the proposal branch. Goal projections, security claims and contract boundaries have been corrected during integration.

## Read first and use our skills branch

Read `AGENTS.md`, `README.md`, `docs/CHALLENGE.md`, `docs/PLAN.md`, `docs/CONTRACT.md`, `docs/DESIGN.md`, `lib/types.ts` and `data/demo-fixtures.ts`.

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

For the Saving preview, use the exact Japan example below. Do not copy the proposal branch's unverified “five weeks sooner”, “no prompt injection” or investment-funded short-term goal claims.

## Ownership: prevent concurrent edits

- You own `app/`, `components/`, `public/`, frontend configuration, `package.json`, lockfile, Next.js/TypeScript/Tailwind setup, `.gitignore` additions needed for frontend builds, and `docs/FRONTEND.md`.
- Codex owns `lib/`, `data/`, `prompts/`, `tests/backend/`, `scripts/backend-*`, backend documentation, `docs/PLAN.md`, `docs/CONTRACT.md` and README updates.
- Do not edit Codex-owned files, duplicate the engine in the frontend, or change the shared contract. Put temporary fixture UI adapters under `components/demo/`, mark them `// DEMO:`, and remove/replace them at integration.
- Prefer your own checkout/branch if another agent uses the same folder. Do not reset, overwrite or stash another person's edits. Before pushing, fetch and rebase your commits on `origin/main`; preserve teammates' code. The user wants completed work committed and pushed to GitHub, not left locally.

## Product and scope

Build an English, KBC-inspired **Life Goals** experience. The customer's explicit goal is the hero: target, actual progress, deadline and one useful next action. **Saving** is the new goal-centred preview; **Moving** remains the existing contract-backed mission, with a shared plan and Tell Once. Products are supporting actions. Use Next.js, TypeScript and Tailwind. No real KBC logo, authentication, database, payments, subscription cancellation, external policy purchase or provider notifications.

Kate uses **advice cards, structured forms and quick replies**. A Kate tab may show the guided history of those cards, but do not build an open-ended model-chat input. Structured input fields for goal amount/date are allowed. All core screens must work without model calls. Do not advertise the design as immune to prompt injection or security problems.

Build order after the user authorises starting: (1) app shell and goals-first home, (2) the existing v1 Moving flow against fixtures/service, (3) the isolated Saving preview below, (4) optional polish. This keeps a complete journey working while the Saving contract is pending.

Prioritise a working continuous demo over extra screens. Optional voice and speculative mission recognition must never block the core journey. A purchase/location display must clearly identify synthetic data; no browser geolocation permission request is needed for this demo.

## Goals-first home and Saving preview

Home must make the selected goal visually dominant. Provide a simple demo selector for **Japan savings** and **Moving**. They are independent synthetic scenarios, not simultaneous allocations of one balance. Avoid presenting a product catalogue as the main screen.

The Saving backend contract is not available yet. Put a local, explicitly named preview model and fixed snapshots under `components/demo/`, mark them `// DEMO: Saving concept preview — not connected to the engine`, and display a visible “Concept preview” label. Do not cast Saving data into v1 `Snapshot`, invent a `saving` RuleId in engine responses, import nonexistent goal-service exports or modify `lib/types.ts` yourself. The future Codex contract replaces this adapter.

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

Preview sequence:

1. Show Japan target, saved amount, deadline and one Kate card: “You have three recurring streaming charges totalling €38/month. Is there one you no longer use?”
2. Evidence drawer lists synthetic recurring charges. Let the customer identify Stream A; never label it unused merely from the transaction pattern.
3. Show the conditional comparison: €125 → €138 planned per month; September → August projected finish, assuming the charge stops and that amount is redirected, with zero interest and uninterrupted contributions.
4. **Add to my plan** records a saving intention. Keep saved amount €650 and progress 32.5%. Display “Planned; subscription not cancelled.” Do not animate the saved balance upward.
5. **Keep this service**, **Not now**, **Why this?**, and reset have clear outcomes in the local preview. No provider is contacted. No new suggestion should immediately replace a dismissed one in this preview.

Do not attribute guaranteed savings, service overlap or external product prices to transaction data. No live scraping or receipt recognition. Lifestyle preferences are future customer opt-ins, not inferred facts; omit lifestyle settings that do not serve the demo.

The Japan deadline is near-term. Do not show the €1,500 investment suggestion in this scenario, count investment principal twice, or assume investment returns will close its gap. The investment simulation belongs only to the existing separate long-term scenario.

## Existing v1 Moving journey

1. Home shows Lotte's account and one relevant Kate action. The initial candidate asks about plans; it is not an approved investment recommendation.
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

The planned Codex implementation entry point is below. It is not currently shipped; check the file exists before importing it into a build:

```ts
import { createMomentsService } from '@/lib/service';
const service = createMomentsService();
```

Create one instance per mounted demo session in a provider above home/Kate/engine views. Do not create a process-wide singleton or a new service on every render. In this synthetic-only MVP the same pure core can run locally in the provider; this does not claim to secure real banking transactions. A future server transport preserves the interface.

Use `getDemoSnapshot('initial')` and the other five fixture states while the service is absent. `demoTransitions` documents the exact happy-path event requests. Put any temporary Moving adapter behind the same interface, and reject unsupported events instead of pretending they worked. Saving has a separate local preview model until a coordinated contract extension lands.

Find the primary action with `snapshot.actions.find(a => a.id === snapshot.decision.primaryActionId)`. Use returned text and amounts. Format integer cents as EUR; do not recompute financial eligibility in UI code. Derive mission progress from shared actions/context, not separate page state. The service owns rules, revisions and completion.

Serialize dispatches, disable pending controls, and replace the provider snapshot with the returned authoritative snapshot on both success and domain error. Surface the error message and require review; never automatically retry confirmation. Reject stale local confirmations gracefully. Treat snapshots as immutable.

## Design and accessibility

Follow `frontend-design` and `kbc-design`: navy/sky tokens, clear type hierarchy, one primary action, short Kate copy, realistic content and consistent spacing. Phone-sized presentation on desktop, usable at mobile width and projector zoom. Use text labels with icons, semantic controls, focus states, labelled inputs and accessible error feedback. Handle loading, empty/quiet, error and success states.

Make the customer's goal visually obvious. In Saving, distinguish the actual-progress bar from a projected-date comparison. In Moving, the home becomes a coherent plan after confirmation. Use a compact timeline/evidence drawer rather than a wall of unrelated cards. If remote font loading breaks a build, use a system-font fallback and record it.

## Optional recognition and voice

After core integration, a proposed independent synthetic purchase/location recogniser may be added under `lib/recognition.ts`; it does not exist yet. Inspect actual exports and the agreed contract before integrating. It proposes a mission only. Confirmed moving data still enters the existing `CONFIRM_MOVING` event. Do not infer item-level purchases, pregnancy or other sensitive characteristics. Location is optional and synthetic. The subscription preview requires no location.

Voice is secondary: show a text fallback and user-initiated playback only if an implementation is available. Never expose API keys in client code. Do not delay the primary demo to integrate ElevenLabs.

## Verify and deliver

Run the app, build/typecheck, and click through the primary journey and reset. Check that home and Kate stay consistent, amounts are correct and stale/error states do not show false success. Use the skills branch's verification and demo-verification workflows, reporting checks you could not perform.

For Saving, verify separately that accepting a plan leaves €650 and 32.5% unchanged, projection dates match the fixed contribution schedule, keeping a subscription does not count savings, and the preview label remains visible. For Moving, preserve all existing event payloads and amounts. Do not describe a local preview as engine-backed or count projected savings as achieved financial benefit.

Write `docs/FRONTEND.md` with run commands, integration status and remaining limitations. Commit only your files, fetch/rebase before pushing, and push completed work. Report the commit and any concrete backend mismatch. Do not claim a fixture-only UI is connected to the real engine.
