---
name: code-review
description: Use to review another developer's or AI agent's changes (diff, branch, PR) before merging to main — focused on breaking bugs, demo failures, integration problems, secrets and needless complexity, not style.
---

# Code Review (hackathon)

## When to use
- Before merging a branch/PR into `main`.
- After an AI agent made a large or multi-file change.
- When integration between workstreams starts failing.

## Time box
5–10 minutes per review. Review the diff, not the whole codebase.

## Workflow
1. Get the diff (`git diff main...branch`) and the stated goal of the change.
2. Check in this order and stop digging once you find blockers:
   1. **Breaking bugs** — crashes, wrong logic on the main path, unhandled null/empty, broken imports, removed code others use.
   2. **Demo failures** — does the demo path still work? Hardcoded localhost/paths, missing seed data, slow/blocking calls without loading state.
   3. **Integration** — does it match the agreed interfaces in `docs/PLAN.md` (routes, JSON shapes, types, env var names)? Unannounced contract changes are blockers.
   4. **Security/secrets** — keys in code or commits, `.env` committed, secrets sent to the frontend.
   5. **Unnecessary complexity** — new dependencies, abstractions, frameworks or infra the demo doesn't need; large rewrites of working code.
3. Run it if you can (`verification` checklist, at least the main journey).
4. Report findings.

## Output format
```
Verdict: MERGE / MERGE AFTER FIXES / DON'T MERGE
Blockers: file:line — problem — suggested smallest fix
Should fix: …
Skip (not worth time now): …
```

## Ignore
Formatting, naming, style preferences, missing comments — unless they hurt readability or demo quality. Don't request refactors late in the event.

## Multiple developers / agents
- The author fixes blockers; reviewers don't rewrite the author's code.
- An agent reviewing another agent's work must verify claims by reading/running code, not trust the summary.

## Stop when
- A verdict is given with concrete blockers (or none). No second review round for non-blockers.
