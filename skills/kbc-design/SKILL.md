---
name: kbc-design
description: Use when building or styling any UI for the KBC track (KBC Mobile look, Kate assistant chat, proactive nudge cards, investment option cards, confirm flows) so every screen shares one KBC-inspired design language in Next.js + Tailwind. Inspired-by only — no real KBC logos or assets.
---

# KBC-inspired design (KBC Mobile + Kate)

## When to use
- Creating or restyling any screen of the KBC demo (home, Kate chat, nudge, options, confirm, engine view).
- Two screens look inconsistent (different blues, radii, fonts).
- Pair with `frontend-design` for general demo-UI rules; this skill only fixes the *look & tone*.

## Rules
- Inspired by KBC, not a copy: no KBC logo, no scraped images. Use a text wordmark or neutral icon.
- Mobile-first: render the app inside a phone frame (~390×844) centred on the page, so it looks like KBC Mobile on a laptop screen.
- Colour values marked (approx) are estimates — consistency matters more than exactness.

## Tokens
| Token | Hex | Use |
|---|---|---|
| `kbc-navy` | `#003768` | primary buttons, headers, headings, user bubbles, nav |
| `kbc-sky` | `#00AEEF` | accents, active states, chip borders, highlights |
| `kbc-kate` | `#E8F4F8` (approx) | Kate message bubbles, info panels |
| `kbc-bg` | `#F5F5F5` (approx) | app background behind cards |
| `kbc-card` | `#FFFFFF` | cards, sheets |
| `kbc-muted` | `#666666` (approx) | secondary text |
| `kbc-line` | `#E0E0E0` (approx) | borders, dividers |
| `kbc-ok` | `#4CAF50` (approx) | success, "matches your profile" |
| `kbc-warn` | `#FF9800` (approx) | warnings, upcoming bills |

Tailwind v4 (`app/globals.css`):
```css
@import "tailwindcss";
@theme {
  --color-kbc-navy: #003768; --color-kbc-sky: #00AEEF; --color-kbc-kate: #E8F4F8;
  --color-kbc-bg: #F5F5F5; --color-kbc-muted: #666666; --color-kbc-line: #E0E0E0;
  --color-kbc-ok: #4CAF50; --color-kbc-warn: #FF9800;
  --font-sans: "Inter", -apple-system, "Segoe UI", sans-serif;
  --shadow-card: 0 2px 4px rgba(0,55,104,.08); --shadow-raised: 0 4px 8px rgba(0,55,104,.12);
}
```
Tailwind v3: put the same values under `theme.extend.colors.kbc`, `fontFamily.sans`, `boxShadow`.
Font: load **Inter** via `next/font/google`.

## Type, shape, spacing
- Sizes: 12 caption · 14 secondary · 16 body · 18 subhead · 20–24 heading. Weights 400 / 500 labels+buttons / 600–700 headings.
- Radius 8px (`rounded-lg`) on cards, buttons, inputs; chips fully rounded (`rounded-full`).
- Cards: white, `p-4`, `border border-kbc-line`, `shadow-card`. Stack with `gap-3`/`gap-4`.
- Relaxed density: 16px gutters, 24px vertical rhythm. One primary action per screen.

## Component patterns
- **Header:** navy bar, white text wordmark left, search/Kate icon + profile icon right.
- **Bottom nav:** fixed, 4–5 items (icon + label), light grey bg, active item in `kbc-sky`.
- **Account card:** account name, IBAN-style muted line, large balance right-aligned.
- **Nudge card (proactive Kate):** full-width, `kbc-kate` or white with a `kbc-sky` left border; Kate avatar left, one-line headline with the key number bold ("You have **€6,200** you're not using"), CTA button right/bottom. Always include a small "Why am I seeing this?" link.
- **Kate chat:** Kate = left, `bg-kbc-kate text-kbc-navy`, round "K" avatar; user = right, `bg-kbc-navy text-white`. Max 2–3 short lines per bubble. Quick replies = outlined `border-kbc-sky` chips under the last Kate message.
- **Action / option card (inside chat):** icon + title + 1-line description + key figures; the recommended one gets a `kbc-ok` "Matches your profile" badge and a navy border. Risk shown as 1–7 dots/bar.
- **Confirm sheet:** bottom sheet, summary rows (amount, product, frequency), reassurance line ("You can stop anytime, no fees to stop"), one full-width navy "Confirm" button + text "Not now". Success = check icon + one sentence + "Back to home".
- **Signals / why panel:** list of chips or rows "Signal → value" in `kbc-kate`, so judges see what the engine detected.

## Voice (Kate)
- Short, warm, second person: "You have…", "Want me to…?", "Here's why:".
- Lead with the customer's benefit (time, money, goal), never product names first.
- Numbers concrete and rounded (€6,200, not €6,187.43). No jargon (say "lower risk", not "defensive UCITS allocation").
- Emoji sparingly — at most one per conversation.
- Always offer a way out: "Not now", "Remind me later".

## Checklist before shipping a screen
- [ ] Only `kbc-*` colours used; no stray default blue/indigo.
- [ ] Inter loaded; headings 600+.
- [ ] 8px radius, card shadow, 16px padding consistent.
- [ ] One primary (navy) action; secondary actions outlined or text.
- [ ] Kate copy ≤ 3 lines per bubble, second person, has an exit option.
- [ ] Looks right inside the phone frame at 390px wide.
