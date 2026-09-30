# Shared agent skills (hackathon)

9 SKILL.md skills for Claude Code, Codex and other agents that read the Agent Skills format.
Typical flow: challenge-analysis → brainstorming → rapid-planning → build (frontend-design + kbc-design, systematic-debugging, verification, code-review) → demo-verification.

Install (user-level, works in any project):
- macOS/Linux: `cp -r skills/*/ ~/.claude/skills/ && cp -r skills/*/ ~/.agents/skills/`
- Windows PowerShell: `Get-ChildItem skills -Directory | % { Copy-Item $_.FullName "$HOME\.claude\skills\" -Recurse -Force; Copy-Item $_.FullName "$HOME\.agents\skills\" -Recurse -Force }`
(create the target folders first if missing). Restart the agent afterwards.

Inspired by the workflows in obra/superpowers (MIT), trimmed for a 4–5 hour hackathon.
