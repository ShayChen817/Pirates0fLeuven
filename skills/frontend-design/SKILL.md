---
name: frontend-design
description: Use when building or polishing UI for a hackathon demo — to get a distinctive, clear, responsive interface with an obvious demo flow instead of a generic AI-looking dashboard.
---

# Frontend Design (demo-grade)

## When to use
- Building the screens of the demo path.
- A screen works but looks generic, cluttered, or confusing to a first-time viewer.

## Time awareness
- First pass: function and layout. Polish only after the demo path works end-to-end.
- Last hour: do NOT redesign working screens. Only fix things a judge would notice (broken layout, unreadable text, missing loading/empty state) or add clear judging value.

## Workflow
1. Write the one sentence each screen must communicate and its **single primary action**.
2. Pick a small design system up front and stick to it: 1 accent color, 1–2 neutrals, one font pair (display + body), a spacing scale (4/8/16/24/32), one radius. Choose them from the problem's world, not a default template.
3. Build the hierarchy: one clear headline/result, primary button visually dominant, secondary actions quiet.
4. Use realistic content: real names, plausible numbers, domain terms from the challenge. No lorem ipsum, no "Item 1".
5. Make the demo flow obvious: the result the judge should remember is the biggest thing on the final screen.
6. Cover states on the demo path: loading (skeleton or clear message), empty, error with a retry, success.
7. Check at laptop width, projector (zoomed 125–150%) and phone width. No horizontal scroll.

## Avoid (generic AI look)
- Purple/blue gradient heroes, a wall of identical cards, emoji as icons, big KPI tiles that aren't the point, everything centered, shadows and rounded corners on every element, Inter-everywhere with no hierarchy.
- Sidebars and settings pages nobody will click in the demo.

## Multiple developers / agents
- Put tokens (colors, fonts, spacing) in one shared file/theme; everyone uses them, no ad-hoc colors.
- One owner per screen. Use the existing component library if the repo has one; don't add a second.

## Stop when
- Each demo screen has one obvious action, realistic data, handled loading/error states, and looks intentional at projector size. Then stop polishing.
