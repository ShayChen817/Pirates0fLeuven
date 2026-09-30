# Backend integration — Moving and Saving

Codex owns the decision services, runtime input validation, fixtures and explanation prompts. After Opus stage 5, the user transferred frontend integration and refinement to Codex. Backend modules have no runtime package dependencies, database or API-key requirement.

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

Cash changes from €2,850 potentially available to €350. Reserve acknowledgement preserves the commitment. External coverage is explicitly customer-reported and can only be reported after a confirmed move whose reserve review is complete (it stays editable afterwards). Simulation confirmation requires at least €100 and never changes balances. Invalid payloads, stale revisions, missing/wrong actions and ineligible amounts are rejected without mutation. Reset advances the revision rather than reusing old versions.

## Saving events

The default seed is the Japan example from README: €650 saved towards €2,000, first contribution 2026-11-01, €125/month, deadline 2027-08-01. `data/saving-fixtures.ts` contains synthetic monthly purchases and independent expected projection values.

| Event | Payload | Effect |
|---|---|---|
| `REVIEW_SUBSCRIPTION` | `merchantId`, `decision: 'unused' \| 'keep'` | Records customer intent; evidence alone never marks a subscription unused. Keeping removes any associated intention. |
| `ADD_SAVING_INTENTION` | `merchantId` | Requires the current saving-intention action and an unused answer. Changes planned contributions only. |
| `REMOVE_SAVING_INTENTION` | `merchantId` | Removes the future intention without changing saved funds. |
| `UPDATE_GOAL` | `title`, `targetCents`, `deadline`, `monthlyContributionCents`, `firstContributionDate` | Recalculates the projection; saved amount is not editable through this event. The target must stay above the saved amount. |
| `RECORD_CONTRIBUTION` | `contributionId`, `amountCents` | Records a separate synthetic contribution. Duplicate IDs are rejected and the amount cannot exceed the remaining gap. This is a demo ledger entry, not a bank transfer. |
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

Requires Node.js 20+ and `npm install` first. It runs the pinned `typescript` and `tsx` devDependencies from `node_modules` directly with Node (no shell, no runtime downloads). Runtime services need neither tool once bundled by Next.js. See [SECURITY.md](../SECURITY.md) for the threat model and business-logic rules.

The checks cover golden transitions, cents arithmetic, concurrency/revisions, cloning, stale data, runtime payload validation, pause/reset/clear, meaningful goal projections and subscription evidence. Browser and Next.js build verification remain the frontend integration stage.

## Deployment boundary

This is the agreed in-process synthetic service boundary, not a standalone HTTP banking server. The same logic can be wrapped in Next.js server routes when needed, but real deployments require authentication, session isolation, persistent transactional state and appropriate data access. Do not expose a process-global service as a multi-user API.


## Profile service (`profile-1.0`)

`createProfileService()` in `lib/profile.ts` is a separate in-process session. Its snapshot contains `revision`, `displayName`, `bio`, `proposed`, `confirmed`, `status` and `source`. ProfileProvider uses the same serialized dispatch hook as Moving/Saving. No HTTP or database is introduced.

```ts
const profile = createProfileService();
const initial = await profile.getSnapshot();
const review = await profile.dispatch({ expectedRevision: initial.revision,
  event: { type: 'SAVE_BIO', bio: 'Help me review subscriptions for my Japan goal.' } });
const confirmed = await profile.dispatch({ expectedRevision: review.snapshot.revision,
  event: { type: 'CONFIRM_PREFERENCES', preferences: ['subscriptions', 'saving'] } });
```

The parser is local regex matching, not an LLM. Allowed tags: `subscriptions`, `coffee`, `moving`, `saving`. Saving a bio (max 800 characters) invalidates old confirmed tags. Manual confirmation can correct or remove any proposal, including confirming an empty list. `CLEAR_PROFILE` empties the bio and both tag lists. Accepted events advance the revision; invalid events and revision conflicts return the current snapshot without mutation. Unknown request/event fields and duplicate or unknown preference tags are rejected.

`subscriptionRelevance(snapshot)` returns `setup`, `review`, `matched` or `unmatched`. The UI uses it to filter optional subscription discovery only. It neither changes financial eligibility nor removes existing saving intentions or Moving commitments. Coffee has no merchant-alternative dataset. Cross-scenario ranking and model prompting are deferred; no bio is sent to the explanation service.


## Saving insights and educational projection

Use `createSavingInsightsService()` separately from `createSavingService()`. It owns the seeded spending total and buffer fixture, and returns its projection only after the buffer gate and explicit request. See CONTRACT for `saving-insights-1.0`. Snapshot copies, revision conflicts and exact-field event validation follow the other services.

`projectMonthlyIllustration(monthlyCents, annualRatePercent, years)` converts an annual effective rate to a monthly rate and computes end-of-month contributions. It accepts nonnegative safe cents, integer horizons from 1–100 years and finite rates above −100% through 100%; unsupported or overflowing results throw. The UI never calculates returns. The shipped example uses €100/month over 10 years at −4%, 0% and +4%, with no fees, tax, inflation or volatility. These are assumptions, not historical returns. Nothing is allocated from Japan, the emergency buffer or Moving.

Subscription IDs remain `stream-a/b/c`, but presentation labels are Netflix, Amazon Prime and Disney+. Their charges remain synthetic. The overview's €38 subscription category is derived from September purchases in the same Saving seed, while other categories are explicit presentation fixtures. The resulting €635 covers selected categories only.
