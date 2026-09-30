# AGENTS.md — Pirates0fLeuven (hackathon mode)

Instructions for every coding agent (Claude Code, Codex, Cursor, Copilot…) working in this repo.
We have ~4–5 hours. Speed wins. These are defaults, not bureaucracy — break them if the demo needs it.

## Priorities
1. A working, demoable vertical slice beats elegant architecture.
2. Solve the actual challenge; visible user value first.
3. Keep scope small. No new infrastructure, frameworks or abstractions unless the demo needs them.
4. Never break what already works. The demo path must run at all times on `main`.

## How to work
- Read `docs/CHALLENGE.md` and `docs/PLAN.md` first if they exist; they are the source of truth for scope and ownership.
- Stay inside your workstream's files. Touching shared interfaces (API shapes, types, env vars)? Announce it in the commit message and update `docs/PLAN.md`.
- Small commits, pushed often. Pull/rebase before pushing. Resolve conflicts by keeping the working version.
- Hardcode, mock, or seed data freely when it unblocks the demo — mark it `// DEMO:` so we can find it.
- Prefer the stack already in the repo. Adding a dependency? Only if it saves real time.
- Before pushing: app starts, build passes, main user journey still works.

## Hard rules (the only ones)
- No secrets in git. Put keys in `.env` (gitignored) and document names in `.env.example`.
- Don't delete or rewrite another person's working code without asking.
- Don't do large refactors or redesigns in the last hour.

## Skills
Shared skills live on the `skills` branch (`skills/<name>/SKILL.md`). Use them when they fit:
challenge-analysis · brainstorming · rapid-planning · frontend-design · kbc-design ·
systematic-debugging · verification · code-review · demo-verification
