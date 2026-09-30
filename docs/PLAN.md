# Plan — Smart Stock and the Moments Engine

Status: Moving v1 and separate Saving v1 services are implemented. Latest delivered backend evidence: strict typecheck and 30 checks passed before this documentation update. Opus owns frontend integration. README defines the product direction.

Principle: **Rules decide. AI explains. Customers stay in control.**

## MVP priorities

P0: Profile-led personalisation (editable bio, confirmed preferences and deterministic relevance ranking), then integrate existing domain services for one synthetic customer, context correction, deterministic recalculation, priority and suppression, shared home/Kate action state, editable customer-provided context, pause control and engine trace.

P1: alternate eligible investment simulation and incomplete-data scenarios. P2: optional LLM, additional product cards and a synthetic benchmark. Build in this order.

## Existing Moving fallback sequence (target 2 minutes 45 seconds)

| Time | Action | Evidence |
|---|---|---|
| 0:00–0:20 | Introduce Shay and show the initial card. | €7,850 cash − €4,000 reserve − €1,000 expenses = €2,850. |
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
| Core engine | Codex | `lib/`, `data/` | contracts → fixture → context → policies → shared reducer → templates |
| Frontend | Opus | `app/`, `components/` | shared provider → home/Kate → context editor → review → trace |
| Design | TBD | `docs/DESIGN.md`, theme | reuse existing research; readable evidence and primary action |
| Demo and submission | TBD | demo assets, README | rehearse continuous story → audit/remediation → screenshots → video and links |

Frontend is running in parallel under Opus. Codex owns backend files and README/context documents; Opus owns app/components and frontend configuration. Use docs/BACKEND.md for current entry points. Do not change one another's files.

- T+1h: continuous synthetic journey clickable, with real state transitions.
- T+2h: service reproduces the five golden transitions; rules, corrections and shared state integrated; acceptance scenarios checked.
- T−1h: feature freeze; fix, audit and rehearse.
- T−30m: successful recording, final audit screenshots and submission links ready.

Exact deadline remains unknown. Adjust checkpoints once confirmed.

## Dependencies and boundaries

Use Next.js, TypeScript and Tailwind. Templates are sufficient. Optional `ANTHROPIC_API_KEY` stays server-side, with its name documented in `.env.example` when created. Generated explanations cannot change rule outputs or add claims.

Do not add auth, a database, real transactions, real KBC APIs, persistent memory, external notification delivery or ML infrastructure. Actual multi-channel operation, large-scale performance and improved customer trust require later validation. Update README run commands only after the app exists and they have been checked.

## Backend stage 1 — delivered

Moving uses `createMomentsService()` from `lib/service.ts` without changing the existing v1 unions. Saving uses a separate `saving-1.0` snapshot/event contract (`lib/saving-types.ts`) and `createSavingService()` from `lib/saving.ts`; this coordinated extension replaces the isolated frontend Saving preview. `data/saving-fixtures.ts` defines the Japan seed and expected values. Read `docs/BACKEND.md` for both service boundaries.

Verification: `node scripts/backend-check.mjs` runs strict TypeScript and 18 checks covering both flows, stale revisions, runtime validation, state isolation, projection maths and subscription evidence. Frontend build and browser verification await integration; no HTTP server, database or external transaction was added. Next stage: signal recognition and constrained explanation prompts.

## Backend stage 2 — delivered

Recognition is a separate `recognition-1.0` contract/service and seed. It checks two relevant purchase categories, 14-day evidence windows, optional city context freshness and explicit feedback; it never writes financial commitments. UI confirms the remaining details via the unchanged Moving event. Saving remains independent.

Kate explanation builders and the canonical prompt accept only approved sentence selection from an optional provider. Templates, required caveats, output validation and timeout fallback work without keys. No real model integration is claimed. Strict typecheck and 30 backend checks pass; browser and Next.js build checks remain with frontend integration.

## Backend stage 3 — integration handoff

README and the Claude frontend prompt now reference the delivered Moving, Saving, recognition and explanation services. Removed obsolete instructions to build a local Saving preview or wait for service exports. Contract shapes remain unchanged in this stage. The later direction-branch profile/bio proposal (`0a4df0d`) is explicitly separated from implemented goal editing.

This documentation-only stage adds no runtime changes. Stage 2 strict TypeScript and 30 passing backend checks remain the latest runtime evidence. No additional tests were run for these prose changes. Frontend start/build/browser checks await the Opus scaffold and integration; no full-stack verification is claimed. Each completed backend stage is committed and pushed to `main` as requested.

## PR #1 integration — Profile priority

Accepted direction: the editable Profile is the shared personalisation context; Saving and Moving are demonstrations. Bio interpretation is now next P0, superseding stage 3's treatment as deferred future work. It is still unimplemented: this PR changes documentation and ignore rules only.

Next backend slice: a separate versioned Profile contract, session service, bounded bio interpretation prompt with no-key fallback, customer confirmation/correction of proposed tags, invalidation on bio edits/deletion, and deterministic matching against eligible domain candidates. Publish types and fixtures with CONTRACT before frontend consumes them. Preserve existing Moving, Saving and recognition unions and financial calculations. No bio-derived risk suitability or automatic money actions.

Frontend: connect delivered services, prepare the Profile edit/confirmation flow, and label any temporary profile-only mock honestly. Opus retains app/component ownership. Completed stages must be pushed. The new frontend scaffold and fixture/preview journeys on main are preserved by merging main into the PR branch; this documentation change does not claim app build or browser verification.

## Shay identity and frontend handover

The user has transferred frontend integration and design ownership to Codex after Opus stage 5. Rename the synthetic customer and stable demo action prefix from `lotte` to `shay` consistently in fixtures, existing checks, UI and documentation. Event shapes and financial values are unchanged. Old in-memory demo sessions should be reloaded. Next stages: Profile service and frontend connection, then responsive layout, visual hierarchy and interaction refinement.
