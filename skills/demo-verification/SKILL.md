---
name: demo-verification
description: Use once an MVP exists, before judging, and whenever someone proposes a new feature late — treat the demo as a production incident: run it from startup to final outcome, harden failure points, and gate new features by demo value vs risk.
---

# Demo Verification

## When to use
- MVP runs end-to-end for the first time.
- At feature freeze (T−1h) and again at T−30m on the actual demo machine.
- Any time someone asks "should we also build X?" after the MVP exists.

## Workflow: run the demo like an incident drill
Run the exact demo script, from a cold start, as the presenter will. Time it. Then answer each question with evidence:
- [ ] **Fresh machine** — can it run from README on a clean clone (install + start)? If not, fix or pin the demo machine.
- [ ] **Credentials** — are all required keys present on the demo machine, and not expiring/rate-limited?
- [ ] **External API fails** — what does the user see? Add a timeout + fallback (cached/mock response) for each external call on the demo path.
- [ ] **Fallback demo data** — is there seeded, realistic data that makes the demo work offline if needed?
- [ ] **Refresh/navigation** — does reload, back button or re-entering a page break state?
- [ ] **Loading/error states** — acceptable on a projector? No blank screens, no raw stack traces.
- [ ] **Deterministic happy path** — same input gives the same good result every time (fix seeds, pin sample inputs, cache LLM outputs if needed).
- [ ] **Under 3 minutes** — including the setup story. Cut steps that don't prove value.
- [ ] **Backup** — screen recording of a successful run, stored somewhere offline.

List every failure with an owner and the smallest fix. Re-run the whole drill after fixes.

## Feature gate (after MVP exists)
For every proposed feature, answer:
1. Does it visibly improve the judging demo?
2. Can it be implemented AND tested in the remaining time?
3. Does it introduce a new dependency?
4. Can the demo survive if it fails?
5. What current task would be displaced?

Build it only if 1, 2 and 4 are clearly yes, 3 is no (or trivial), and 5 is acceptable. Otherwise recommend NOT building it, and say why in one line.

## Multiple developers / agents
- One person owns the demo script and the demo machine; everyone else hands them changes before freeze.
- After freeze, merges to `main` need the demo owner's OK.

## Stop when
- Two consecutive clean cold-start runs under 3 minutes, fallbacks in place, backup video recorded.
