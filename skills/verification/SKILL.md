---
name: verification
description: Use after any meaningful change and before every push/merge or "it's done" claim — run a quick evidence-based check that the app starts, builds, the critical path works and no secrets leak. Not production-grade testing.
---

# Verification

## When to use
- Before saying "done", "fixed", or "works".
- Before pushing to or merging into `main`.
- After pulling someone else's changes, or after dependency/env changes.

## Core rule
Claims need evidence from this session: command output, a screenshot, an actual response. "Should work" is not verification.

## Checklist (~5 minutes)
- [ ] **App starts** from a clean command (the one in README), no errors in terminal or browser console.
- [ ] **Build passes** (`build`/typecheck/lint that the project already has). Don't add new tooling now.
- [ ] **Critical API path works** — one real request with realistic input returns the expected shape.
- [ ] **Main user journey works** — click through the demo path end-to-end.
- [ ] **Demo data works** — seed/fixture data loads; nothing depends on data only on your machine.
- [ ] **Env vars documented** — every variable used is listed in `.env.example` with a note.
- [ ] **No secrets committed** — check `git diff --cached` for keys/tokens; `.env` is gitignored.

Existing automated tests: run them if they're fast. Write new tests only for tricky core logic where a bug would kill the demo.

## Time awareness
- Early: run the checklist at every checkpoint.
- Final hour: run it after every merge to `main`, on the demo machine.

## Multiple developers / agents
- Whoever merges into `main` runs the checklist after the merge, not only on their branch.
- If a check fails because of someone else's change, tell them with the exact error; don't silently patch their code.

## Stop when
- All boxes are checked with evidence, or failures are reported to the owner with repro steps. Do not expand this into a full test suite.
