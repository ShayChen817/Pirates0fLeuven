# Plan — Smart Stock (KBC proactive assistant)

Principle: **rules decide, AI explains, humans confirm.**
Pitch frame: Smart Stock is the first "moment" of a generic **Moments Engine** (signals → context → rules → next-best-action → Kate). Investment is the demo; insurance/savings/loans are the same pipeline with different rules.

## Demo path (video < 3 minutes) — README is the canonical product description
1) **Dashboard** for **Lotte** (balanced risk profile, long-term goal). Kate nudge: "You have €1,500 more available than you normally need. Would you like to see what you could do with it?"
2) **Financial context**: €7,850 balance − €4,000 emergency buffer − €1,000 upcoming expenses = €2,850 available → €1,500 suggested (~50% of available, rounded to €500).
3) **Smart Stock options**: Safe / Balanced / Growth — risk level, allocation, why it matches, goals supported; Balanced highlighted.
4) **Explanation & confirmation**: ✓ buffer protected ✓ bills covered ✓ matches risk profile ✓ fits goal → Confirm simulation → success.
5) **Behind the scenes** view: signals detected, context numbers, rules evaluated (fired / skipped + reason).
6) Switch customer: **Pieter** (bills due, low buffer) → no investment nudge ("we stay quiet"). **Sara** (address changed, no home insurance) → insurance nudge from the *same engine*. = Scale.

## Architecture (one Next.js app, no backend DB)
```
data/customers.json      mock KBC data (3 personas)
lib/types.ts             shared types (contract below) — change = announce in commit
lib/context.ts           buildContext(customer) -> CustomerContext
lib/rules.ts             Rule[] registry: idle-cash, home-insurance, (stub) savings-goal
lib/engine.ts            evaluate(ctx) -> { nudges: Nudge[], trace: RuleTrace[] }
lib/options.ts           investment options Safe/Balanced/Growth for an amount + risk profile
lib/explain.ts           template text; optional LLM rewrite if ANTHROPIC_API_KEY set
app/page.tsx             phone-frame app: home → Kate chat → options → confirm
app/engine/page.tsx      behind-the-scenes view
app/api/explain/route.ts optional LLM explanation (falls back to template)
```

## Interfaces (lib/types.ts)
```ts
type RiskProfile = "defensive" | "neutral" | "dynamic";
interface Customer {
  id: string; name: string; age: number; riskProfile: RiskProfile;
  balances: { current: number; savings: number };
  monthlyIncome: number;
  transactions: { date: string; amount: number; category: string; label: string }[]; // last 90d
  upcomingBills: { date: string; amount: number; label: string }[];
  goals: { label: string; target: number; date: string }[];
  events: { type: "address_change" | "salary_increase" | "new_child"; date: string }[];
  products: string[]; // e.g. ["current_account","savings","car_insurance"]
}
interface CustomerContext {
  customer: Customer;
  totalCash: number; avgMonthlySpend: number; bills30d: number;
  safetyBuffer: number;      // 3 × avgMonthlySpend
  excessCash: number;        // totalCash − bills30d − safetyBuffer − goal reserve
  signals: { id: string; label: string; value: string }[];
}
interface Nudge {
  id: string; ruleId: string; domain: "invest" | "insurance" | "savings" | "loan";
  title: string; message: string; why: string[]; cta: string; amount?: number;
}
interface RuleTrace { ruleId: string; fired: boolean; reason: string }
interface InvestOption {
  id: "safe" | "balanced" | "growth"; label: string; amount: number;
  expectedReturn: string; risk: 1|2|3|4|5|6|7; matchesProfile: boolean; blurb: string;
}
```
Rule shape: `{ id, domain, when(ctx): { fire: boolean; reason: string }, build(ctx): Nudge }`

Example: Lotte — balance €7,850, bills30d €1,000, emergency buffer €4,000 → **excessCash = €2,850** → rule `idle-cash` fires (threshold €1,000) → suggested amount €1,500.

## Workstreams
| Workstream | Owner | Files/dirs | Tasks (in order) |
|---|---|---|---|
| Core engine | TBD | `lib/`, `data/` | types → customers.json (3 personas) → context → rules + engine → options → explain templates |
| Frontend | TBD | `app/`, `components/`, `tailwind.config` | phone frame + home + nudge card (against mock Nudge) → Kate chat → options → confirm → engine page |
| Design/brand | subagent → `docs/DESIGN.md` | `docs/DESIGN.md` | KBC colours, type, Kate chat patterns |
| Demo/pitch | TBD | `docs/PITCH.md` | story (Understand/Adapt/Scale), script, backup video |

Frontend starts immediately on hardcoded objects matching `types.ts`; swap in `evaluate()` when core is ready.

## Env vars
`ANTHROPIC_API_KEY` (optional, explanation text only; app works without it). Document in `.env.example`.

## Checkpoints
- T+1h: skeleton — home → nudge → options → confirm clickable with hardcoded data.
- T+2h: real engine wired, 3 personas switchable, engine page shows trace.
- T−1h: feature freeze. Polish + pitch.
- T−30m: rehearsed; backup video recorded.

## Not building
Auth, database, real trading, real KBC APIs, questionnaire flows, i18n, charts beyond one simple range bar.
