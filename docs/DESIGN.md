# KBC Mobile + Kate Design Language

## Color Tokens
- **Primary Blue (Dark):** `#003768` — main UI, buttons, navigation
- **Primary Blue (Light):** `#00AEEF` — accents, highlights, active states
- **Turquoise/Cyan Accent:** `#00AEEF` (variant of light blue for secondary CTAs)
- **Background (Light):** `#FFFFFF`
- **Background (Cards):** `#F5F5F5` (approx)
- **Text (Primary):** `#003768` (dark blue, matches primary)
- **Text (Secondary):** `#666666` (approx)
- **Success/Green:** `#4CAF50` (approx — banking standard)
- **Warning/Orange:** `#FF9800` (approx — alerts/notifications)
- **Divider/Border:** `#E0E0E0` (approx)

## Typography
- **Font Family:** Inter or system sans-serif (Google Fonts: **Inter** or **Open Sans** for fallback)
- **Web Font:** Use `font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;`
- **Size Scale:** 12px (caption) → 14px (body) → 16px (standard body) → 18px (subhead) → 20-24px (heading)
- **Font Weight:** 400 (regular), 500 (medium buttons/labels), 600-700 (headings)

## Shape & Spacing
- **Corner Radius:** 8px (cards, buttons, inputs) — soft, modern banking feel
- **Card Style:** Elevated shadow, padding 16px, subtle border `1px solid #E0E0E0` (approx)
- **Shadows:** Light elevation (`0 2px 4px rgba(0,55,104,0.08)`); medium (`0 4px 8px rgba(0,55,104,0.12)`)
- **Density:** Relaxed — 16px padding gutters, 8px/12px component spacing, 24px vertical rhythm
- **Gap between elements:** 12-16px horizontal, 16-24px vertical

## Kate Chat UI Patterns
- **Kate Messages:** Soft light-blue bubbles (`#E8F4F8` approx) with `#003768` text, left-aligned, small avatar (initial "K" or icon)
- **User Messages:** Dark blue bubbles (`#003768`) with white text, right-aligned
- **Quick Reply Chips:** Outlined buttons with `#00AEEF` border, white fill, no shadow — tap to send
- **Action Cards:** Rounded card with icon + label + description; confirm button in primary blue
- **Message Input:** Bottom-fixed, white background, text field with light border, microphone icon (voice toggle)
- **Tone:** Short, friendly, second-person ("your account", "let me help"), emoji use sparingly for warmth

## Mobile App Layout Patterns
- **Bottom Navigation Bar:** 4-5 icons + labels, fixed, light gray background, active state in light blue
- **Account Cards:** Stack of horizontal cards (16px margin), each showing balance/account type, leading image or icon
- **Nudge Cards:** Full-width highlight card with action (savings tip, offer), icon on left, CTA button right
- **Notification/Push Cards:** Toast-style or banner, top margin-safe area, auto-dismiss or tap
- **Header:** Simple dark-blue bar with logo, search icon (Kate trigger), account icon

## Quick Start: 5 DOs for KBC-Inspired UI
1. **Use the primary dark blue (#003768) for all primary actions, text, and navigation.** Pair with light blue (#00AEEF) for accents and hover states.
2. **Build cards with 8px radius, 16px padding, and soft shadows.** Stack them vertically with 12-16px gaps on mobile.
3. **Put bottom-fixed navigation bar with 4-5 destinations; always visible, thumb-friendly.** Use icon + label.
4. **Chat bubbles: Kate = light-blue left, User = dark-blue right.** Quick replies are outlined chips; confirm buttons are solid blue.
5. **Typography: Inter or Open Sans, 16px body, 600wt headings.** Keep copy short, friendly, and in second person ("your", "let me").

---

*Inspired by KBC Mobile app and Kate digital assistant (2020+). Not official KBC design—for hackathon reference only.*
