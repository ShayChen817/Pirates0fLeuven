# Copy this prompt into Claude Code

You own the **frontend** of Pirates0fLeuven. Codex is simultaneously implementing the **backend decision engine, shared service, synthetic signal recognition, tests and AI explanation prompts**. Build the working frontend now; use the existing typed fixtures until the engine lands.

Repository: https://github.com/ShayChen817/Pirates0fLeuven

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

## Ownership: prevent concurrent edits

- You own `app/`, `components/`, `public/`, frontend configuration, `package.json`, lockfile, Next.js/TypeScript/Tailwind setup, `.gitignore` additions needed for frontend builds, and `docs/FRONTEND.md`.
- Codex owns `lib/`, `data/`, `prompts/`, `tests/backend/`, `scripts/backend-*`, backend documentation, `docs/PLAN.md`, `docs/CONTRACT.md` and README updates.
- Do not edit Codex-owned files, duplicate the engine in the frontend, or change the shared contract. Put temporary fixture UI adapters under `components/demo/`, mark them `// DEMO:`, and remove/replace them at integration.
- Prefer your own checkout/branch if another agent uses the same folder. Do not reset, overwrite or stash another person's edits. Before pushing, fetch and rebase your commits on `origin/main`; preserve teammates' code. The user wants completed work committed and pushed to GitHub, not left locally.

## Product and scope

Build an English, KBC-inspired **Life Missions** experience: one Moving mission, one shared plan and Tell Once. The app should make the customer feel understood and let them correct assumptions. Use Next.js, TypeScript and Tailwind. No real KBC logo, authentication, database, payments, external policy purchase or provider notifications.

Prioritise a working continuous demo over extra screens. Optional voice and speculative mission recognition must never block the core journey. A purchase/location display must clearly identify synthetic data; no browser geolocation permission request is needed for this demo.

## Required journey

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

Codex's implementation entry point will be:

```ts
import { createMomentsService } from '@/lib/service';
const service = createMomentsService();
```

Create one instance per mounted demo session in a provider above home/Kate/engine views. Do not create a process-wide singleton or a new service on every render. In this synthetic-only MVP the same pure core can run locally in the provider; this does not claim to secure real banking transactions. A future server transport preserves the interface.

Use `getDemoSnapshot('initial')` and the other five fixture states immediately while the service is absent. `demoTransitions` documents the exact happy-path event requests. Put any temporary adapter behind the same interface, and reject unsupported events instead of pretending they worked.

Find the primary action with `snapshot.actions.find(a => a.id === snapshot.decision.primaryActionId)`. Use returned text and amounts. Format integer cents as EUR; do not recompute financial eligibility in UI code. Derive mission progress from shared actions/context, not separate page state. The service owns rules, revisions and completion.

Serialize dispatches, disable pending controls, and replace the provider snapshot with the returned authoritative snapshot on both success and domain error. Surface the error message and require review; never automatically retry confirmation. Reject stale local confirmations gracefully. Treat snapshots as immutable.

## Design and accessibility

Follow `frontend-design` and `kbc-design`: navy/sky tokens, clear type hierarchy, one primary action, short Kate copy, realistic content and consistent spacing. Phone-sized presentation on desktop, usable at mobile width and projector zoom. Use text labels with icons, semantic controls, focus states, labelled inputs and accessible error feedback. Handle loading, empty/quiet, error and success states.

Make the mission transformation visually obvious: a general home becomes a coherent Moving plan after confirmation. Use a compact timeline/evidence drawer rather than a wall of unrelated cards. If remote font loading breaks a build, use a system-font fallback and record it.

## Optional recognition and voice

After core integration, Codex will expose an independent synthetic purchase/location recogniser from `lib/recognition.ts`; inspect its actual exported types before integrating. It proposes a mission only. Confirmed moving data still enters the existing `CONFIRM_MOVING` event. Do not infer item-level purchases, pregnancy or other sensitive characteristics. Location is optional and synthetic.

Voice is secondary: show a text fallback and user-initiated playback only if an implementation is available. Never expose API keys in client code. Do not delay the primary demo to integrate ElevenLabs.

## Verify and deliver

Run the app, build/typecheck, and click through the primary journey and reset. Check that home and Kate stay consistent, amounts are correct and stale/error states do not show false success. Use the skills branch's verification and demo-verification workflows, reporting checks you could not perform.

Write `docs/FRONTEND.md` with run commands, integration status and remaining limitations. Commit only your files, fetch/rebase before pushing, and push completed work. Report the commit and any concrete backend mismatch. Do not claim a fixture-only UI is connected to the real engine.
