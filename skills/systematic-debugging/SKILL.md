---
name: systematic-debugging
description: Use for any bug, failing build, crash, or unexpected behavior — reproduce, isolate, find root cause, apply the smallest fix, verify. Prevents random multi-file changes that break working code.
---

# Systematic Debugging

## When to use
- Something that worked is broken, a build/test fails, or behavior differs from expected.
- You are tempted to "just try" changing several things.

## Iron rule
Never change several components at once hoping one fixes it. One hypothesis, one change, one check.

## Workflow
1. **Reproduce** — exact command/steps, exact error text. If you can't reproduce it, you can't claim it's fixed.
2. **Isolate** — find the smallest failing piece: which layer (UI, API, data, env), which request, which commit (`git diff`, `git stash`, `git bisect` if it used to work). Check the boring causes first: env vars, wrong port/URL, stale server, missing install, CORS, typo in a key.
3. **Root cause** — state it in one sentence: "X fails because Y." Read the actual error and the code around it; add a log/print if needed. No fix until you can state the cause.
4. **Smallest fix** — change the minimum lines at the cause. No refactors, no "while I'm here" cleanups.
5. **Verify** — rerun the reproduction, then the main demo path (`verification`). Remove debug logs you added.

## Escalate / change strategy
- 3 failed fix attempts on the same bug → stop, re-question the hypothesis, tell the team.
- 20 minutes stuck on a non-core feature → propose cutting or mocking it (`// DEMO:`).

## Time awareness
- Final hour: prefer the lowest-risk fix — a fallback, a hardcoded value, hiding a broken optional feature — over a proper fix that touches shared code. Revert to the last working commit if a fix is spreading.

## Multiple developers / agents
- Before editing a file owned by someone else, tell them; they may already be fixing it.
- Report fixes in the commit message: symptom, cause, fix.

## Stop when
- The reproduction passes, the demo path still works, and the cause is written down. Or the feature is cut/mocked by team decision.
