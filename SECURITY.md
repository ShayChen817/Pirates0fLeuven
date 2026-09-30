# Security model

Hackathon proof of concept for the KBC track. This file records the threat model that security findings are assessed against.

## What the application is

- **No server-side state.** The Next.js app is statically rendered. The decision services (`lib/service.ts`, `lib/saving.ts`, `lib/recognition.ts`) run in the visitor's browser. Each mounted demo session has its own in-memory instance (`components/session/useServiceSession.ts`).
- **No API routes, database, persistence, cookies or local storage.** A reload starts a new session.
- **Synthetic data only.** Every customer, amount, purchase and date comes from the fixtures in `data/`. There is no real account, transaction, KBC system or personal data.
- **No credentials.** No API keys are used or required. `.env*` is gitignored. No model provider is configured.

## Identity, authentication and authorisation

- **Authentication:** there is no login, because there is nothing to protect behind one. Each browser session holds exactly one synthetic customer (`customerId: 'shay'`). That ID is a label inside the fixture; it is never read from input.
- **IDOR:** there is no cross-customer lookup. Events that target an action must name the session's current primary pending action (`lib/service.ts`). Merchant and hypothesis IDs are matched against the session's own lists. No event can address another customer or another session.
- **Production use:** a real deployment must move these services behind authenticated server endpoints, with per-user session isolation, persistent transactional state and authorisation checks on every event. A process-wide service must never be exposed as a multi-user API.

## Business-logic controls

All services validate every event before changing state:
- exact keys only;
- safe-integer cents;
- round-trip date checks;
- `expectedRevision` must match exactly, which blocks stale or replayed confirmations.

A rejected event never mutates state. The specific rules are:

| Rule | Where |
|---|---|
| Action events must target the current primary pending action | `lib/service.ts` |
| Coverage can be reported only after a confirmed move whose reserve review is complete | `lib/service.ts` |
| An investment simulation must be at least EUR 100 and at most the potentially available cash, re-checked against the current context | `lib/service.ts` |
| A saving intention needs the customer's "unused" answer and uses the service's own amount, never a client amount | `lib/saving.ts` |
| A self-recorded contribution cannot exceed the remaining gap; a goal edit cannot set the target at or below the saved amount | `lib/saving.ts` |
| Recognition feedback must name the active hypothesis in the generated ID format | `lib/recognition.ts` |

`tests/backend/` covers these rules. Run `node scripts/backend-check.mjs` to check them. The script uses the pinned local devDependencies, with no shell and no downloads.

## AI and injection boundaries

- An explanation provider, if one is ever injected, may only return approved sentence IDs. Its output is parsed with a size cap and schema-validated. The text shown is always the service's own approved sentences, and any failure falls back to the template (`lib/explain.ts`). Raw merchant labels, customer text and location are never sent.
- React escapes all rendered text. There is no `dangerouslySetInnerHTML`, `eval` or dynamic code.
- `next.config.ts` sends CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` and `Permissions-Policy` headers.

## Reporting

This is a hackathon repository. Open a GitHub issue for security concerns, and do not include real personal data.
