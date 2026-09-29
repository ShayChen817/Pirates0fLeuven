---
name: brainstorming
description: Use after the challenge summary exists to generate several genuinely different solution approaches and pick one using hackathon criteria (fit, user value, differentiation, buildability, demo clarity, dependency risk).
---

# Brainstorming

## When to use
- `docs/CHALLENGE.md` exists and the team has not committed to an approach.
- A chosen approach just proved unbuildable and you need a pivot.

## Time box
20–30 minutes. Pivot brainstorms later in the day: 10 minutes max.

## Workflow
1. Re-read the challenge summary: user, pain, judging criteria, demo outcome.
2. Generate 4–6 approaches that differ in *kind*, not just in features (e.g. different user moment, different interaction model, different use of the sponsor's data). For each: one-line pitch + the 3-step demo.
3. Score each 1–5:

| Criterion | Question |
|---|---|
| Challenge fit | Does it directly hit the judging criteria and sponsor goal? |
| User value | Would the named user actually use it tomorrow? |
| Differentiation | What makes it stand out from the other 20 teams? |
| Buildability | Can our team finish the MVP in the hours left? |
| Demo clarity | Can a judge "get it" in 30 seconds? |
| Dependency risk | How many external APIs/models/keys must work? (5 = few) |

4. Pick the winner. Tie-breaker: buildability and demo clarity beat technical sophistication. A simple idea executed fully beats an ambitious one half-done.
5. Write down: chosen approach, why, the fallback approach, and what we explicitly rejected. Append to `docs/CHALLENGE.md`.

## Rules
- Do not default to the most technically impressive idea (fine-tuning, multi-agent systems, blockchain, custom infra) unless the challenge rewards exactly that.
- "AI chatbot for X" is only acceptable if a chat is really the best interface for the user.
- Ask the user/team one question at a time if a choice depends on their preference.

## Multiple developers / agents
- Each person/agent may propose approaches independently first (avoids groupthink), then merge into one table.
- One person makes the final call; timebox debate.

## Stop when
- One approach is chosen with a fallback, and everyone can state the 3-step demo. Then go to `rapid-planning`.
