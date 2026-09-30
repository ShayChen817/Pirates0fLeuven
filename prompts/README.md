# Kate explanation prompt

Canonical prompt: [`kate-explanation.ts`](kate-explanation.ts). Builders and runtime validator: [`../lib/explain.ts`](../lib/explain.ts).

The shipped implementation uses deterministic approved sentences. An optional model may select/order sentence IDs; it cannot introduce new wording, amounts, product recommendations or actions. This is deliberately narrower than unrestricted rephrasing.

```ts
import { buildSavingExplanation, explain } from '@/lib/explain';
const envelope = buildSavingExplanation(await savingService.getSnapshot());
const result = await explain(envelope); // template, no key or model call
```

An optional server-side `ExplanationProvider` receives `{ system, user, signal }` and returns a JSON string or object containing only `sentenceIds`. Include each required sentence exactly once. Unknown IDs, duplicates, missing caveats, extra fields, malformed output, provider failure and timeout fall back to the template. The default timeout is 800 ms, capped at 5 seconds; the provider receives an abort signal.

Never expose a provider key in the frontend. No live model provider or SDK is configured in this repository. Integration can inject one later without changing core decisions. The default path works fully offline.

Builders receive an authoritative snapshot and emit only the controlled facts needed for that scenario. They do not forward goal titles, merchant labels, customer names or raw locations. Do not construct envelopes from arbitrary customer text. The envelope and final response retain revision/action IDs so the UI can discard a response whose underlying state changed during generation.

The prompt is one layer, not a security guarantee. Runtime allowlisting constrains the accepted output. The financial services remain deterministic and never use generated text as an event or rule input.
