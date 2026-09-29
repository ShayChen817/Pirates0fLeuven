---
name: rapid-planning
description: Use once a solution is chosen to split it into independent parallel workstreams (frontend, core logic/backend, integration/data, demo/pitch) with agreed interfaces, owners and checkpoints, before anyone writes feature code.
---

# Rapid Planning

## When to use
- An approach is chosen and 2+ people or agents are about to start building.
- Work is colliding (merge conflicts, people waiting on each other) and needs re-splitting.

## Time box
15 minutes. The plan is a page, not a document.

## Workflow
1. Write the demo path as numbered user steps. Everything in the plan must serve one of these steps.
2. Split into workstreams (merge or drop ones you don't need):
   - **Frontend** — screens of the demo path.
   - **Core logic / backend** — the thing that produces the result.
   - **Integration / data** — external APIs, datasets, seed/demo data, auth keys.
   - **Demo / pitch** — story, slides, script, demo data, video backup.
3. Define interfaces **before** coding: API routes with example request/response JSON, shared types, file/folder ownership, env var names. Frontend starts against a mock of this contract immediately.
4. Order tasks per workstream so something end-to-end works early (walking skeleton: UI → API → fake result), then replace fakes with real logic.
5. Set checkpoints relative to the deadline (see below).
6. Write `docs/PLAN.md` (template below).

## Checkpoints (adjust to actual time)
- T+1h: skeleton demo path runs end-to-end with fake data.
- T+2.5h: real core logic wired in.
- T−1h: **feature freeze.** Only fixes, polish and demo prep.
- T−30m: demo rehearsed on the demo machine; backup video recorded.

## Template
```
# Plan
Demo path: 1) … 2) … 3) …
Interfaces: POST /api/x  {in} -> {out}  (example JSON)
Env vars: X_API_KEY (owner: …)
| Workstream | Owner | Files/dirs | Tasks (in order) |
Checkpoints: …
Not building: …
```

## Rules
- No architecture work the demo doesn't need: no microservices, queues, auth systems, DB migrations framework, CI pipelines, unless required by the challenge.
- One repo, one start command.
- Each AI agent gets one workstream and its directory; tell it which files it must not touch.

## Stop when
- Every demo step has an owner, interfaces have example payloads, and everyone can start without waiting on someone else.
