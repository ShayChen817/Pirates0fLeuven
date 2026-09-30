# Shared frontend / engine contract — v1.0

The canonical Moving types are in [`lib/types.ts`](../lib/types.ts) and examples in [`data/demo-fixtures.ts`](../data/demo-fixtures.ts). The implementation is `createMomentsService()` in [`lib/service.ts`](../lib/service.ts). UI integration is now owned by Codex following the user-authorised handover. See [BACKEND.md](BACKEND.md) for usage and checks.

Saving is a separately versioned `saving-1.0` contract in [`lib/saving-types.ts`](../lib/saving-types.ts), implemented by `createSavingService()` in [`lib/saving.ts`](../lib/saving.ts), with [`data/saving-fixtures.ts`](../data/saving-fixtures.ts). The existing v1 unions are unchanged; frontends must use the correct service and snapshot type for each scenario.

## Parallel work and ownership

| Owner | Files | Responsibility |
|---|---|---|
| Core engine developer | `lib/`, `data/` | Maintain the contract, fixtures, evaluation, reducer and `MomentsService` implementation. |
| Frontend developer | `app/`, `components/` | Render snapshots, collect typed events and provide shared session state above home/Kate/engine routes. |

Agree any contract change before either side depends on it. Update types, golden fixtures and this document together; announce the change in the commit message. Do not independently redefine these types in UI files. No REST backend is required for this Next.js MVP.

## Integration boundary

```ts
interface MomentsService {
  getSnapshot(): Promise<Snapshot>;
  dispatch(request: DispatchRequest): Promise<DispatchResult>;
}
```

Create one `createMomentsService()` instance per demo session. Replace temporary fixture adapters with this implementation. `getDemoSnapshot` and `demoTransitions` remain reference examples; they are not the running service.

```ts
import type { MomentsService, CustomerEvent, Snapshot } from '../lib/types';
import { getDemoSnapshot } from '../data/demo-fixtures';

const initialPreview = getDemoSnapshot('initial');
const primary = initialPreview.actions.find(
  action => action.id === initialPreview.decision.primaryActionId,
);

// Pattern for the shared UI provider once the service exists:
async function send(service: MomentsService, current: Snapshot, event: CustomerEvent) {
  const result = await service.dispatch({ expectedRevision: current.revision, event });
  // Replace the provider's snapshot on both success and domain error.
  // On error, show result.error.message and require review before another submission.
  return result;
}
```

Treat returned snapshots as immutable. Replace the provider state with the returned snapshot; do not patch home and Kate separately. Serialize submissions and disable the pending control. A transport/runtime failure preserves the last snapshot and offers an explicit retry; do not automatically retry a confirmation.

## Data conventions

- Money: nonnegative safe integer EUR cents. `785000` means €7,850. Display with `Intl.NumberFormat('en-BE', { style: 'currency', currency: 'EUR' })` after dividing by 100.
- `asOf` and signal timestamps: ISO UTC instants. Due dates: `YYYY-MM-DD`. History months: `YYYY-MM`.
- Fixed clock: `2026-10-01T12:00:00.000Z`. The moving fixture is due `2026-11-01`. Evaluation uses the fixture clock, not the machine's date.
- `revision` is the session mutation counter: every successful event increments it once, including reset. Failed events change nothing. `context.version` increments only when facts or proactive preferences change; acknowledging or dismissing an action changes only revision.
- `RESET_DEMO` restores initial data but advances revision and context version from their current values; it must not recreate an old revision. A full page reload creates a new demo session. Golden fixture revisions describe independent fresh-session paths.
- IDs are stable: customer `shay`; actions `shay:<ruleId>`. A pending action must reference the current context version. Historical resolved actions may retain the version at which they were resolved.
- `primaryActionId` references a pending member of `actions`, or is `null`. Render an ordinary home screen when it is null. Never show an error simply because Kate stays quiet.
- Trace has one row for each of the four rule IDs. Every referenced evidence ID must exist in `context.signals`. Do not calculate eligibility from display text.
- `commitments` represent additional expenses, not amounts already in `expensesCents`. Upsert by ID. Identical repeats do not duplicate money; conflicting duplicate IDs in one input are invalid.
- Coverage provenance is explicit. `confirmed-covered` in this MVP is customer-reported external coverage, not insurer verification.
- Clearing moving context removes its commitment and associated signals and returns intent/commitment confirmation to unknown unless another explicit plan establishes them. Clearing intent also clears the horizon; clearing coverage resets its source to unknown. Re-evaluate affected action resolutions with a recorded reset reason.

## Customer events

All events go through `dispatch({ expectedRevision, event })`. Fields below refer to the discriminated union in `lib/types.ts`; the engine performs runtime validation as well as TypeScript checking.

| Event | Payload | Required behaviour |
|---|---|---|
| `CONFIRM_MOVING` | `commitment` with stable ID, positive integer cents, future due date and `purpose: 'moving'` | Upsert commitment, record customer evidence, set near-term intent and recompute. Reset reserve acknowledgement if the amount/date materially changes. |
| `CONFIRM_LONG_TERM` | `horizonYears`, `noAdditionalCommitments: true` | Record explicit intent and horizon. Reject while a conflicting moving commitment remains; do not erase it implicitly. |
| `ACKNOWLEDGE_RESERVE` | `actionId` | Complete the current primary reserve action without deleting the commitment or moving money. |
| `REPORT_COVERAGE` | `confirmed-covered` or `confirmed-need` | Update customer-reported context and resolve the coverage question. For confirmed need, show an informational acknowledgement; real insurance referral/purchase is outside MVP. |
| `DISMISS_ACTION` | `actionId` | Dismiss the current primary action and re-evaluate. A dismissal is not evidence that an unknown fact is false. |
| `CONFIRM_SIMULATION` | `actionId`, adjustable `amountCents` | Check revision, current eligibility and a positive integer amount no greater than available cash; complete simulation only. |
| `CLEAR_CONTEXT` | `field: 'coverage'`, `'intent'` or `'moving'` | Clear the specified customer context and dependent signals; reassess and reopen relevant questions when necessary. |
| `SET_PROACTIVE` | `enabled` | Pausing clears the primary action on both surfaces; resuming preserves resolved actions and evaluates current facts. |
| `RESET_DEMO` | none | Restore the starting scenario while advancing counters; no external effects. |

Action-targeting events require a matching pending primary action and the appropriate rule. The service derives action state and calculated amounts; the UI cannot submit arbitrary eligibility, reasons, balances or completed status.

For coverage, `confirmed-need` completes the question with `COVERAGE_HELP_REQUESTED`; `confirmed-covered` uses `COVERAGE_CONFIRMED`. An explicit coverage edit is allowed through the context panel even after the original question closes. If a reserve review is dismissed, do not immediately replace it with another commercial prompt; keep the related coverage candidate deferred until explicit review or a material plan change. Context controls remain available.

## Success and error responses

Success: `{ ok: true, snapshot }`. Domain error: `{ ok: false, error: { code, message }, snapshot }`. Every error carries the current authoritative snapshot and leaves it unmodified.

| Error code | Trigger | Frontend response |
|---|---|---|
| `REVISION_CONFLICT` | Expected revision differs from current revision. Check this before processing the event. | Adopt returned state, explain that plans changed and ask the customer to review. |
| `INVALID_EVENT` | Unknown/malformed event, unsafe amount, invalid date or contradictory input. | Preserve state and show a useful correction message. |
| `ACTION_NOT_AVAILABLE` | Wrong, resolved, non-primary or missing target action. | Refresh the visible action from the response. |
| `NOT_ELIGIBLE` | Current rules reject the investment simulation or requested amount. | Show the current reason; do not display success. |

No HTTP status codes are part of v1. A future transport must preserve these semantics and add session isolation; the demo customer ID is not authentication.

## Unified examples

Import `demoFixtures`, `getDemoSnapshot` and `demoTransitions`. Never mutate exported golden fixtures; the getter deep-clones them.

| Fixture ID | Revision / context version | Available cash | Primary action | Expected view |
|---|---|---:|---|---|
| `initial` | 1 / 1 | €2,850 | `shay:clarify-intent` | Ask about upcoming plans; investment deferred. |
| `moving` | 2 / 2 | €350 | `shay:moving-reserve` | Review €2,500 moving reserve; investment suppressed. |
| `coverage-check` | 3 / 2 | €350 | `shay:coverage-check` | Reserve acknowledged; ask about existing cover. |
| `covered` | 4 / 3 | €350 | none | External coverage answer retained; prompt closed on both views. |
| `investing` | 2 / 2 | €2,850 | `shay:explore-investment` | Alternate seven-year goal; €1,500 adjustable simulation. |
| `invested` | 3 / 2 | €2,850 | none | Simulation complete; cash unchanged. Fixture ID is not evidence of a real investment. |

Main path: `initial → moving → coverage-check → covered`.
Alternate path starts in an independent fresh session: `initial → investing → invested`.

Example request:

```json
{
  "expectedRevision": 1,
  "event": {
    "type": "CONFIRM_MOVING",
    "commitment": {
      "id": "moving-2026-10",
      "amountCents": 250000,
      "dueDate": "2026-11-01",
      "purpose": "moving"
    }
  }
}
```

Expected success snapshot: `getDemoSnapshot('moving')`. An old request with `expectedRevision: 1` after that success returns `REVISION_CONFLICT` and the unchanged moving snapshot at revision 2. No retry silently confirms an earlier suggestion.

## Integration handoff

Frontend can build every listed state directly from fixtures. Core logic must implement `MomentsService`, reproduce the five exported transitions and satisfy the edge cases in PLAN. Compare business state, counters, primary IDs, amounts, status and reason codes; wording can be refined together without changing semantics.

Fixtures validate the agreement, not engine correctness. Pause, clear, dismissal, stale data and invalid-input scenarios still need implementation and verification before claiming the app works.


## Separate Profile contract: `profile-1.0`

Canonical types and implementation: `lib/profile.ts`. This addition does not widen Moving, Saving or recognition unions.

| Event | Payload | Effect |
|---|---|---|
| `SAVE_BIO` | `bio: string` (max 800 characters) | Trim bio, propose allowlisted keyword tags, clear old confirmations; review required |
| `CONFIRM_PREFERENCES` | `preferences: Preference[]` (0–4 unique allowed tags) | Store explicit selections/corrections; no financial mutation |
| `CLEAR_PROFILE` | None | Clear bio, proposals and confirmations |

Every dispatch requires `expectedRevision`. Success increments the revision and returns a copied snapshot. `INVALID_EVENT` and `REVISION_CONFLICT` return authoritative state without mutation. One shared Profile session is read by Home, Kate and Profile. Domain sessions keep independent revisions and balances. Reset of either scenario also clears the shared Profile; ordinary scenario switching preserves it.

`source: local-keywords` identifies proposed interpretation; `source: customer` identifies manual confirmation. Unknown bio text can yield an empty proposal. Confirmation is required before a preference influences subscription discovery. This release does not implement cross-domain ranking, a live LLM, external data ingestion or persisted customer records.


## Separate Saving insights contract: `saving-insights-1.0`

Canonical types: `lib/saving-insights-types.ts`. Implementation: `createSavingInsightsService()` in `lib/saving-insights.ts`. Seed: `data/saving-insights-fixtures.ts`. This educational context is not a cash ledger or an investment allocation. Existing Moving/Saving/Profile unions and revisions are unchanged.

The snapshot includes independent `revision`, spending period/categories/total, emergency amount/target/gap/status, `longTermRequested`, and a nullable `illustration`. The illustration is returned only after the fixture buffer reaches its target and the customer requests it. Values use EUR integer cents.

| Event | Effect |
|---|---|
| `SET_DEMO_FUNDED { funded: boolean }` | Presenter-only fixture switch between seeded buffer and target; invalidates previous example request |
| `REQUEST_LONG_TERM_EXAMPLE` | Rejected below target; otherwise records explicit request and returns the hypothetical calculation |
| `RESET_DEMO` | Restores original buffer and spending; clears the request |

Dispatch requires `expectedRevision`. Accepted events increment revisions. Unknown fields/events return `INVALID_EVENT`, stale revisions return `REVISION_CONFLICT`, and a gated request returns `ACTION_NOT_AVAILABLE`; all errors include a copied current snapshot without mutation. The service is not connected to any bank API. The shell resets this session alongside Saving. Saving pause/snooze suppresses the optional UI entry without changing historical observations.
