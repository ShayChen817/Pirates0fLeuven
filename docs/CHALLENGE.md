# Challenge summary — KBC track

**Brief (quoted):** "Imagine that KBC could understand and know what a customer wants and needs before they even ask it."
Three dimensions: **Understand** (situation, intent, context) · **Adapt** (how the experience changes, at which moment) · **Scale** (all products, services, channels — 2.5M customers, "not just moving homes").
Ask: "a proof of concept with a vision. Show us the signals for the customer, show us how the experience feels like, and show us how it can scale." Theme: **Save Time and Money**. "Don't think like a bank."

User: a KBC Mobile customer in their late 20s–30s with a steady salary, whose savings sit on a current/savings account because investing feels complicated and scary.
Pain: "I know I should do something with that money, but I don't know how much is safe to move, what to pick, or where to start." Money loses value to inflation and nobody tells them — an accepted, invisible frustration.
Sponsor wants: proactive, personalised next-best-action (like the "you moved — need home insurance?" example), delivered through Kate, that clearly generalises beyond one product.
Judging (official): 1) Creativity 2) Technical Ability 3) Fit 4) Security.
Hard constraints: Aikido security audit required · no passwords / API keys / confidential data in uploads · submission = short project description + demo video < 3 min + public GitHub repo + Aikido screenshots · README must explain how to run and list unfinished functionality. Deadline: UNKNOWN.
Data/APIs: none provided → JSON mock customer data (tested: n/a).

Demo outcome: "A judge sees Kate notice that Lotte has €6,200 more than she needs, explain *why* in one sentence, offer 3 options that fit her risk profile, and let her confirm in 2 taps. Then the judge sees the same engine skip a customer with upcoming bills, and fire a different nudge (home insurance) for a customer who just moved."

MVP: mock customer → context engine (balance, bills, buffer, goals) → rule fires "idle cash" → Kate nudge → 3 options (Safe / Balanced / Growth) → explanation → simulated confirm.

Out of scope: real KBC APIs, auth, real trading/order execution, real MiFID suitability questionnaire, ML models, multi-language, native mobile app, backend database.

## Assumptions we are challenging
- "The bank waits for you to ask" → KBC comes to you at the right moment, and **stays silent** when it's the wrong moment (bills due, low buffer). Not nudging is part of the value.
- "Investing = picking products" → the customer only answers "how much can I spare, and how much risk?" — the engine does the rest.
- "Personalisation = AI black box" → **rules decide, AI explains, human confirms.** Every nudge shows the signals that triggered it.

## Risks to address in the pitch
- Regulation: investment suggestions need a risk profile / suitability check (MiFID II). We use the customer's existing risk profile and frame options as KBC-style fund profiles, not stock tips.
- "Smart Stock" can sound like pushing products → lead with *time saved* and *money not losing value*, and show the no-nudge case.

Open questions: judging weights? deadline? can we use KBC brand look?
