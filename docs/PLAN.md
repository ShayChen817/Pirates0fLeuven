# Plan — Smart Stock and the Moments Engine

Status: shared TypeScript contracts and six synthetic snapshots are available. UI, decision engine and service implementation remain planned. README defines the product direction.

Principle: **Rules decide. AI explains. Customers stay in control.**

## MVP priorities

P0: one synthetic customer, context correction, deterministic recalculation, priority and suppression, shared home/Kate action state, editable customer-provided context, pause control and engine trace.

P1: alternate eligible investment simulation and incomplete-data scenarios. P2: optional LLM, additional product cards and a synthetic benchmark. Build in this order.

## Demo sequence (target 2 minutes 45 seconds)

| Time | Action | Evidence |
|---|---|---|
| 0:00–0:20 | Introduce Lotte and show the initial card. | €7,850 cash − €4,000 reserve − €1,000 expenses = €2,850. |
| 0:20–0:45 | Open the evidence view. | Observed amounts, three months of illustrative behaviour and unknown intent are distinct. |
| 0:45–1:20 | Confirm a €2,500 moving commitment due next month. | €350 remains; investment is suppressed and a reserve review replaces the question. |
| 1:20–1:50 | Acknowledge the simulated reserve, then answer the coverage check. | “Already insured elsewhere” closes the shared prompt. No real transfer or insurance action occurs. |
| 1:50–2:15 | Switch between home and Kate; edit the stored context. | Both surfaces use the same state and preserve the correction. |
| 2:15–2:45 | Show decision trace and explain reuse. | Candidate reasons and explicit production limitations. |

The initial investment candidate is deferred, not an approved recommendation. An optional alternate path confirms no additional plans and a long-term goal, then reviews and confirms an illustrative €1,500 investment simulation.

## Smallest architecture

```text
 data/demo-fixtures.ts    six golden snapshots, monthly summaries and typed transitions
 lib/types.ts             canonical v1.0 contracts and MomentsService boundary
 lib/context.ts           current facts, validity checks and cash calculation
 lib/rules.ts             clarify-intent, moving-reserve, coverage-check, explore-investment
 lib/engine.ts            eligibility, priority and suppression; no model dependency
 lib/state.ts             shared session reducer and customer feedback
 lib/explain.ts           templates first; optional approved-fact rewrite
 app/page.tsx             home / Kate / review / context controls
 app/engine/page.tsx      demo trace using the same shared state
 components/              cards, evidence panel and confirmation views
```

Place the state provider above both routes so client navigation preserves the session. Reload resets the demo and is labelled accordingly. No database or external services are required for P0.

## Shared contract and unified examples

- [`../lib/types.ts`](../lib/types.ts) is the canonical TypeScript contract: context, signals, actions, decisions, snapshots, customer events, errors and `MomentsService`.
- [`../data/demo-fixtures.ts`](../data/demo-fixtures.ts) provides six typed snapshots and five typed event transitions. Frontend starts with `getDemoSnapshot('initial')`; core logic implements the same service boundary.
- [`CONTRACT.md`](CONTRACT.md) specifies ownership, event semantics, revisions, runtime validation, errors and UI integration.

`getSnapshot(): Promise<Snapshot>` reads the session. `dispatch({ expectedRevision, event }): Promise<DispatchResult>` applies an event and returns authoritative state. This is an in-process async boundary; no HTTP server is required.

Use `decision.primaryActionId` to look up one pending action in `actions`. There is no duplicated `primary` object and no separately maintained home/Kate action state. The frontend provider owns rendering; the engine service owns state transitions.

| Path | Fixture sequence | Amounts |
|---|---|---|
| Main | initial → moving → coverage-check → covered | €2,850 → €350 → €350 → €350 |
| Alternate, fresh session | initial → investing → invested | €2,850 available; €1,500 simulation; balances unchanged |

Amounts are integer EUR cents. `revision` increments on every accepted mutation, while `context.version` increments on factual/preference changes. Reset advances both counters; it does not reuse stale versions. Errors carry current state without mutation. Keep action IDs stable per customer and rule.

These contracts replace the earlier draft. Changes affect both workstreams: update types, fixtures and contract documentation together, and announce changes in commit messages.

## Decision policies

1. Use a fixed `asOf` date from the fixture. Check required inputs for validity. Stale or conflicting facts produce a clarification or deferral, never assumed spare cash.
2. Calculate `max(0, accessible cash − reserve − expenses − additional commitments)`. Include ordinary living costs; deduplicate commitments by ID before calculating.
3. Behaviour uses three illustrative monthly income and essential-spending totals with a named fixture rule. It provides context for a question; it cannot establish intent or guarantee future income. Record the rule and evidence in the trace.
4. For the initial fixture, clarify unknown commitments and intent before considering investment. Treat current explicit corrections as stronger than conflicting inferences.
5. A confirmed moving commitment selects a reserve review. Acknowledging it completes the review only; the commitment stays in the calculation.
6. Once reserve review is complete, offer a coverage check if a move is confirmed and coverage remains unknown. An external-policy answer is customer-confirmed information and resolves the prompt without claiming independent verification.
7. The illustrative investment path requires current complete data, explicit long-term intent, a complete synthetic profile, a fixture horizon of at least five years and at least €1,000 available. These are demo gates, not a production suitability policy. Half the available amount rounded to the nearest €500 and capped at the available amount gives €1,500 for the example.
8. Select at most one pending eligible action. Priority: material clarification → moving reserve → coverage check → investment exploration. All other candidates receive trace reasons.
9. Context changes invalidate incompatible pending actions and increment the version. Check the latest context again at confirmation; an older investment screen cannot confirm a now-ineligible suggestion.
10. Completion and dismissal survive ordinary re-evaluation. A materially different explicit customer plan may reopen the relevant action, with a recorded reason; routine rendering or unrelated signals must not reopen it.
11. Clearing customer-provided facts makes them unknown and triggers reassessment. Pausing suggestions sets `primary` to null on both surfaces. Resume re-evaluates current facts while respecting resolved actions. Normal navigation stays available.

Example initial outcome: `clarify-intent` selected; `explore-investment` deferred with `INTENT_UNKNOWN`. After moving confirmation: `moving-reserve` selected; investment suppressed with `NEAR_TERM_COMMITMENT`. After external coverage confirmation: `coverage-check` suppressed with `COVERAGE_CONFIRMED`.

## Acceptance scenarios to verify after implementation

| Scenario | Expected result |
|---|---|
| Initial fixture | €2,850 potentially available; clarify intent; no approved investment recommendation. |
| Confirm long-term alternate path | Eligible illustrative €1,500 simulation; explicit confirmation; no execution. |
| Add €2,500 moving commitment | €350 remains; investment unavailable; reserve review selected. |
| Submit stale investment confirmation | Rejected after current-context evaluation. |
| Acknowledge reserve | Commitment remains; coverage check may become primary. |
| Confirm external insurance | Same prompt resolves in home and Kate; ordinary re-evaluation does not reopen it. |
| Clear customer coverage answer | Coverage becomes unknown; reassess relevant action with an explicit reset reason. |
| Pause suggestions | No proactive primary action on either surface; navigation remains available. |
| Stale inputs or incomplete profile | No investment offer; explicit deferral or clarification. |
| Duplicate commitment ID | Count once; unchanged €350 calculation. |
| Navigate home → Kate → engine | One shared customer state, no duplicate actions. |
| Reload demo | Documented reset to initial fixture. |

These are acceptance criteria, not completed test results. Record actual evidence when implementation exists.

## Workstreams and checkpoints

| Workstream | Owner | Files | Ordered work |
|---|---|---|---|
| Core engine | TBD | `lib/`, `data/` | contracts → fixture → context → policies → shared reducer → templates |
| Frontend | TBD | `app/`, `components/` | shared provider → home/Kate → context editor → review → trace |
| Design | TBD | `docs/DESIGN.md`, theme | reuse existing research; readable evidence and primary action |
| Demo and submission | TBD | demo assets, README | rehearse continuous story → audit/remediation → screenshots → video and links |

Frontend starts against the contract; owners must be assigned before parallel feature work. No agent delegation is required by this plan.

- T+1h: continuous synthetic journey clickable, with real state transitions.
- T+2h: service reproduces the five golden transitions; rules, corrections and shared state integrated; acceptance scenarios checked.
- T−1h: feature freeze; fix, audit and rehearse.
- T−30m: successful recording, final audit screenshots and submission links ready.

Exact deadline remains unknown. Adjust checkpoints once confirmed.

## Dependencies and boundaries

Use Next.js, TypeScript and Tailwind. Templates are sufficient. Optional `ANTHROPIC_API_KEY` stays server-side, with its name documented in `.env.example` when created. Generated explanations cannot change rule outputs or add claims.

Do not add auth, a database, real transactions, real KBC APIs, persistent memory, external notification delivery or ML infrastructure. Actual multi-channel operation, large-scale performance and improved customer trust require later validation. Update README run commands only after the app exists and they have been checked.
