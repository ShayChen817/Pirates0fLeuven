# Challenge summary — KBC track

## Vision and customer promise

A shared understanding of the customer turns changing life context into timely, coordinated support across KBC. Smart Stock is the first demonstration of this Moments Engine.

Customer promise: explain your situation once, correct it easily, and receive help that changes with your life. Keeping money available can be a successful outcome.

**Brief:** understand what customers need and respond at the right moment through a scalable personalisation approach that strengthens the customer relationship. The live briefing frames this as **Understand · Adapt · Scale** and **Save Time and Money**.

User: a customer with some savings who needs to coordinate daily liquidity, upcoming life plans and longer-term goals.
Pain: the customer must connect fragmented information, repeat their situation and judge whether a product suggestion fits their current life.
Sponsor objective: demonstrate a reusable approach across products, services and channels, with a working example and a credible scale vision.

## Source facts and constraints

- Participant guide, pages 3–4: scalable personalisation for more than 2.3 million customers; the live briefing refers to 2.5 million. Use “millions” without claiming measured production capacity.
- Guide, pages 6–7: Aikido audit contributes 10% of assessment; submit screenshots before and after remediation.
- Guide, pages 11–12: creativity, technical ability, fit and security; Builderbase submission with description, video under three minutes, public repository and audit screenshots. Include run instructions and unfinished functionality; build during the official time slot and preserve the final submitted version.
- Data: synthetic fixtures only. No live KBC integration has been established.
- Unknown: exact deadline, weights of the other criteria and any branding restrictions.

## Answering the five questions

| Question | MVP evidence |
|---|---|
| Signals | Accessible cash, commitments, three monthly income/spending summaries, explicit goals and customer corrections, all with provenance and freshness. |
| Situation, behaviour, intent | Keep liquidity facts, recurring patterns and confirmed plans distinct. Behaviour may trigger clarification; it does not establish investment intent. |
| Adaptation | A moving commitment changes the calculation, removes an investment candidate and changes the next step. |
| Products and channels | Cash planning and coverage checks reuse context; home and Kate share the same action state. |
| Impact at scale | Reusable evaluation and suppression logic, observable reasons, and a future pilot measuring relevance and effort. No production-scale claim. |

## Chosen approach and alternatives

Chosen: a Moments Engine with customer-correctable context and coordinated actions. It directly demonstrates understanding and adaptation while remaining buildable in one app.

Retain investment exploration as the entry use case and an alternate demo path. Incorporate reminder suppression into the shared engine.

Deferred: a complete moving concierge, additional product integrations and production channel delivery. They expand scope without being needed to prove the mechanism.

Fallback if time is tight: fixed synthetic fixtures, template explanations, one continuous moving journey and a decision trace. Preserve real state transitions and shared action state; omit optional LLM, benchmark and extra investment cards.

## Demo outcome

A judge sees Lotte's €7,850 balance minus €4,000 reserve and €1,000 upcoming expenses, leaving €2,850 potentially available. The initial primary action asks about missing context. An investment candidate is deferred until intent and eligibility are known.

Lotte confirms a separate €2,500 moving commitment: €350 remains, the investment candidate is suppressed, and the interface prioritises the moving reserve. After acknowledging the reserve, she can check existing coverage. “Already insured elsewhere” resolves that prompt in both home and Kate. The engine trace explains each change.

An alternate reset path confirms a long-term goal and permits a €1,500 investment simulation under explicit demo assumptions. No money moves.

## Relationship hypothesis

Visible assumptions, respected corrections and fewer repeated questions should improve trust and reduce effort. These are hypotheses to measure, not results already achieved. Product conversion is not the sole success metric.

## Scope

Required: deterministic rules, synthetic behaviour signal, editable context, one primary action, suppression reasons, shared session state, templates and simulated confirmation.

Excluded: real data, payments, trading, real authentication, a production suitability assessment, persistent memory, external channel delivery, complex ML and infrastructure. No sensitive life-event inference from merchant names or private communications.

Status: concept, plan, shared TypeScript interfaces and six synthetic snapshots are available. The application, decision service and end-to-end verification remain pending. README is the canonical product description; PLAN contains the implementation contract.
