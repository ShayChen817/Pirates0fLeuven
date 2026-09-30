# Backend integration — Moving and Saving

Codex owns the decision services, runtime input validation, fixtures and explanation prompts. Opus owns the Next.js UI, shared React provider, framework configuration and package manifest. Backend modules have no runtime package dependencies, database or API-key requirement.

## Start here: two isolated services

```ts
import { createMomentsService } from '@/lib/service';
import { createSavingService } from '@/lib/saving';

const moving = createMomentsService();
const saving = createSavingService();
const movingState = await moving.getSnapshot();
const savingState = await saving.getSnapshot();
```

Create each instance once per demo session in the UI provider. Both expose `getSnapshot()` and `dispatch({ expectedRevision, event })`. Adopt the returned snapshot on success or domain error. Disable the pending submit control and do not silently retry a confirmation. Returned objects are copies and cannot mutate internal state.

The Moving v1 types and six existing fixtures are unchanged. Saving has a separate `saving-1.0` contract in `lib/saving-types.ts`; do not cast it to the Moving `Snapshot`. This avoids widening unions currently consumed by the frontend. The two scenarios do not share or double-allocate a bank balance.

## Moving events

Use `lib/types.ts`, `data/demo-fixtures.ts` and `docs/CONTRACT.md`. Example:

```ts
const result = await moving.dispatch({
  expectedRevision: movingState.revision,
  event: { type: 'CONFIRM_MOVING', commitment: {
    id: 'moving-2026-10', amountCents: 250000,
    dueDate: '2026-11-01', purpose: 'moving',
  } },
});
```

Cash changes from €2,850 potentially available to €350. Reserve acknowledgement preserves the commitment. External coverage is explicitly customer-reported. Simulation confirmation never changes balances. Invalid payloads, stale revisions, missing/wrong actions and ineligible amounts are rejected without mutation. Reset advances the revision rather than reusing old versions.

## Saving events

The default seed is the Japan example from README: €650 saved towards €2,000, first contribution 2026-11-01, €125/month, deadline 2027-08-01. `data/saving-fixtures.ts` contains synthetic monthly purchases and independent expected projection values.

| Event | Payload | Effect |
|---|---|---|
| `REVIEW_SUBSCRIPTION` | `merchantId`, `decision: 'unused' \| 'keep'` | Records customer intent; evidence alone never marks a subscription unused. Keeping removes any associated intention. |
| `ADD_SAVING_INTENTION` | `merchantId` | Requires the current saving-intention action and an unused answer. Changes planned contributions only. |
| `REMOVE_SAVING_INTENTION` | `merchantId` | Removes the future intention without changing saved funds. |
| `UPDATE_GOAL` | `title`, `targetCents`, `deadline`, `monthlyContributionCents`, `firstContributionDate` | Recalculates the projection; saved amount is not editable through this event. |
| `RECORD_CONTRIBUTION` | `contributionId`, `amountCents` | Records a separate synthetic contribution. Duplicate IDs are rejected. This is a demo ledger entry, not a bank transfer. |
| `SNOOZE_ADVICE` | none | Suppresses advice for 30 days relative to the fixed demo clock. |
| `SET_PROACTIVE` | `enabled` | Pauses/resumes advice while preserving customer facts and resolved choices. |
| `RESET_DEMO` | none | Restores the seed and increments revision. |

```ts
let state = await saving.getSnapshot();
let result = await saving.dispatch({ expectedRevision: state.revision,
  event: { type: 'REVIEW_SUBSCRIPTION', merchantId: 'stream-a', decision: 'unused' } });
state = result.snapshot;
result = await saving.dispatch({ expectedRevision: state.revision,
  event: { type: 'ADD_SAVING_INTENTION', merchantId: 'stream-a' } });
```

The result has `goal.savedCents === 65000`, `projected.progressPercent === 32.5`, `projected.monthlyCents === 13800`, and `projected.completionDate === '2027-08-01'`. Baseline remains September. All projections state their assumptions; no interest or investment return is included.

`primary === null` means quiet, not an error. A keep answer or accepted intention does not immediately trigger another sales card. UI can still offer manual review controls. `baseline` and `projected` are separate from actual `goal.savedCents`.

Subscription detection requires three equal online streaming charges spaced 25–35 days apart, within a 100-day lookback, with the latest charge at most 40 days old. Duplicate transaction IDs count once; conflicting duplicates fail. These are explicit demo heuristics, not actual subscription or cancellation verification.

## Optional purchase/location recognition

`createRecognitionService()` in `lib/recognition.ts` provides a separate `recognition-1.0` service (`lib/recognition-types.ts`). It starts with `data/recognition-fixtures.ts`: synthetic furniture and moving-service payments, with device city context disabled by default.

- Two distinct qualifying categories within 14 days produce a possible mission; neither location alone nor duplicate payments can do so.
- `SET_SOURCES` takes `purchaseHistory` and `location` booleans. Source withdrawal removes dependent hypotheses. Optional device city context is used only while less than 24 hours old.
- `RECORD_FEEDBACK` takes the current `hypothesisId` and `decision: 'confirm' | 'reject' | 'later'`. Reject/later suppresses that bundle for 30 days. Confirmation records intent but never assumes a date, destination or cost.
- `CLEAR_CONFIRMED_MISSION` clears the explicit confirmation and suppresses immediate re-suggestion. `RESET_DEMO` resets the seed and advances revision.

After confirmation, the frontend gathers the remaining cost/date and separately dispatches Moving's `CONFIRM_MOVING` event. This explicit handoff prevents a location hint from silently changing financial commitments. A direct Moving flow still works without recognition. These services have independent revision counters.

`evaluateRecognition(seed, preferences, feedback)` exposes pure evaluation with a supplied clock for checking expiry. The demo session has a fixed clock; there is no continuous real-device tracking or live purchase ingestion.

## Constrained Kate explanations

Use `buildMovingExplanation`, `buildSavingExplanation` or `buildRecognitionExplanation` from `lib/explain.ts`, then call `explain(envelope)`. The default is a template with zero model calls. An optional injected provider may only select/order approved sentence IDs. Runtime validation retains every required sentence and rejects invented output; provider failure or timeout falls back to the template.

See `prompts/kate-explanation.ts` and `prompts/README.md`. Raw merchant labels, customer names, custom goal titles and location strings are not sent to a model. No live model adapter or credentials are included. Discard an explanation if its returned revision/action ID no longer matches the visible scenario.

## Run backend checks

```sh
node scripts/backend-check.mjs
```

Requires Node.js 20+ and npm/npx. It uses pinned TypeScript and tsx development tools via the npm cache, so the first run needs network access. It does not change the frontend package manifest. Runtime services work without those tools once bundled by Next.js.

The checks cover golden transitions, cents arithmetic, concurrency/revisions, cloning, stale data, runtime payload validation, pause/reset/clear, meaningful goal projections and subscription evidence. Browser and Next.js build verification remain the frontend integration stage.

## Deployment boundary

This is the agreed in-process synthetic service boundary, not a standalone HTTP banking server. The same logic can be wrapped in Next.js server routes when needed, but real deployments require authentication, session isolation, persistent transactional state and appropriate data access. Do not expose a process-global service as a multi-user API.
