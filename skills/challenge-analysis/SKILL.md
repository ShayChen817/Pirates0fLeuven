---
name: challenge-analysis
description: Use right after a hackathon challenge is released (or when the team is unsure what to build) to turn the brief into a one-page challenge summary covering user, pain, sponsor goal, judging criteria, constraints, MVP and out-of-scope.
---

# Challenge Analysis

## When to use
- The challenge brief, sponsor slides, or dataset/API docs have just been shared.
- The team disagrees about what the challenge is asking for.
- Before `brainstorming`. Do not start coding before this exists.

## Time box
15–20 minutes total. If a fact is unknown, write `UNKNOWN — ask organizers` and move on.

## Workflow
1. Read every provided source (brief, rubric, API docs, sample data). Quote exact wording for judging criteria and hard constraints.
2. Extract, one or two lines each:
   - **Actual user** — a specific person, not "users".
   - **Actual pain point** — what hurts today, in their words.
   - **Sponsor objective** — what the sponsor wants to see or reuse (their API, their data, their product story).
   - **Judging criteria** — list with weights if given.
   - **Hard constraints** — required tech, data, rules, submission format, deadline.
   - **Available data/APIs** — what exists, access method, rate limits, keys needed, whether it actually works (make one test call if cheap).
   - **Demoable outcome** — what a judge sees in 3 minutes that proves the pain is solved.
   - **MVP** — the smallest end-to-end flow that produces that outcome.
   - **Out of scope** — explicit list of tempting things we will NOT build.
3. List open questions for organizers/mentors.
4. Write the summary to `docs/CHALLENGE.md` (template below) and share it with the team.

## Output template
```
# Challenge summary
User: …
Pain: …
Sponsor wants: …
Judging: 1) … 2) … 3) …
Hard constraints: …
Data/APIs: … (tested: yes/no)
Demo outcome: "A judge sees …"
MVP: step 1 → step 2 → step 3
Out of scope: …
Open questions: …
```

## Multiple developers / agents
- One person (or agent) owns the summary; others read sources in parallel and report findings to them.
- The summary is the shared source of truth. Other agents should read `docs/CHALLENGE.md` before planning or coding.

## Stop when
- Every field is filled or marked UNKNOWN, the summary fits on one screen, and the team agrees on the demo outcome. Then go to `brainstorming`.
