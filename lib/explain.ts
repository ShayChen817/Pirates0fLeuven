import { KATE_EXPLANATION_SYSTEM_PROMPT } from '../prompts/kate-explanation.ts';
import { formatEuro } from './context.ts';
import { exactKeys, record } from './validation.ts';
import type { Snapshot } from './types.ts';
import type { SavingSnapshot } from './saving-types.ts';
import type { RecognitionSnapshot } from './recognition-types.ts';

export interface ExplanationEnvelope {
  kind: 'moving' | 'saving' | 'recognition'; revision: number; actionId: string | null;
  sentences: { id: string; text: string; required: boolean }[];
}
export interface ExplanationRequest { system: string; user: string; signal: AbortSignal }
export type ExplanationProvider = (request: ExplanationRequest) => Promise<unknown>;
export interface ExplanationResult { text: string; source: 'template' | 'approved-selection'; revision: number; actionId: string | null }
const sentence = (id: string, text: string) => ({ id, text, required: true });

export function buildMovingExplanation(snapshot: Snapshot): ExplanationEnvelope {
  const action = snapshot.actions.find(item => item.id === snapshot.decision.primaryActionId);
  // Only controlled engine sentences: raw merchant labels, goals, locations and customer text are omitted.
  const sentences = [sentence('context', `Based on the recorded amounts, ${formatEuro(snapshot.availableCashCents)} is potentially available.`)];
  if (snapshot.decision.trace.some(row => row.reasonCode === 'STALE_OR_MISSING_DATA' || row.reasonCode === 'CONFLICTING_DATA')) {
    sentences[0] = sentence('context', 'Some recorded information needs checking before a suggestion can be made.');
  }
  const next: Record<string, string> = {
    'clarify-intent': 'Confirm your upcoming plans so the next step can fit your situation.',
    'moving-reserve': 'Review the moving commitment before considering other uses for this money.',
    'coverage-check': 'Check whether you already have suitable cover, including with another provider.',
    'explore-investment': 'You can review an illustrative long-term investment simulation under the stated demo assumptions.',
  };
  sentences.push(sentence('next', action ? next[action.ruleId] : 'There is no new proactive action to take right now.'));
  sentences.push(sentence('boundary', 'This demonstration does not move money, buy cover or execute an investment.'));
  return { kind: 'moving', revision: snapshot.revision, actionId: action?.id ?? null, sentences };
}
export function buildSavingExplanation(snapshot: SavingSnapshot): ExplanationEnvelope {
  const sentences = [sentence('progress', `Your recorded saved amount is ${formatEuro(snapshot.goal.savedCents)} towards ${formatEuro(snapshot.goal.targetCents)}.`)];
  if (snapshot.projected.completionDate) sentences.push(sentence('projection',
    `With ${formatEuro(snapshot.projected.monthlyCents)} contributed each month, the projected completion date is ${snapshot.projected.completionDate}, assuming zero interest and uninterrupted contributions.`));
  else sentences.push(sentence('projection', snapshot.projected.remainingCents === 0
    ? 'The recorded amount has reached the target.' : 'A completion date is unavailable under the current contribution plan.'));
  sentences.push(sentence('boundary', 'A saving intention does not cancel a subscription or increase your recorded savings; you must stop the cost and redirect the money yourself.'));
  return { kind: 'saving', revision: snapshot.revision, actionId: snapshot.primary?.id ?? null, sentences };
}
export function buildRecognitionExplanation(snapshot: RecognitionSnapshot): ExplanationEnvelope {
  return { kind: 'recognition', revision: snapshot.revision, actionId: snapshot.hypothesis?.id ?? null, sentences: [
    sentence('evidence', snapshot.hypothesis ? 'Recent furniture and moving-service payments suggest a possible move.'
      : snapshot.confirmedMission ? 'You confirmed a moving goal.' : 'There is no active moving suggestion from the permitted evidence.'),
    sentence('confirmation', snapshot.hypothesis ? 'Please confirm or correct the suggestion before a moving plan is created.' : 'You can start or update a mission directly.'),
    sentence('boundary', 'Purchase patterns and optional city context do not prove where you live or why you made a purchase.'),
  ] };
}

export function buildExplanationRequest(envelope: ExplanationEnvelope): { system: string; user: string } {
  return { system: KATE_EXPLANATION_SYSTEM_PROMPT,
    user: JSON.stringify({ kind: envelope.kind, sentences: envelope.sentences }) };
}
function selectApproved(envelope: ExplanationEnvelope, response: unknown): string | null {
  let value = response;
  if (typeof value === 'string') {
    if (value.length > 4096) return null;
    try { value = JSON.parse(value); } catch { return null; }
  }
  if (!record(value) || !exactKeys(value, ['sentenceIds']) || !Array.isArray(value.sentenceIds) ||
    value.sentenceIds.length === 0 || value.sentenceIds.length > envelope.sentences.length) return null;
  const ids: unknown[] = value.sentenceIds;
  if (new Set(ids).size !== ids.length || !ids.every(id => typeof id === 'string' && envelope.sentences.some(sentence => sentence.id === id)) ||
    envelope.sentences.some(sentence => sentence.required && !ids.includes(sentence.id))) return null;
  return ids.map(id => envelope.sentences.find(sentence => sentence.id === id)!.text).join(' ');
}
/**
 * No provider = no network and template text. None is configured in this repository. A provider may only
 * return approved sentence IDs; its output is validated here and never rendered directly.
 */
export async function explain(envelope: ExplanationEnvelope, provider?: ExplanationProvider, timeoutMs = 800): Promise<ExplanationResult> {
  const approved = structuredClone(envelope);
  const fallback = { text: approved.sentences.map(sentence => sentence.text).join(' '), source: 'template' as const,
    revision: approved.revision, actionId: approved.actionId };
  if (!provider) return fallback;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const budget = Number.isFinite(timeoutMs) ? Math.max(1, Math.min(timeoutMs, 5000)) : 800;
    const response = await Promise.race([
      Promise.resolve().then(() => provider({ ...buildExplanationRequest(approved), signal: controller.signal })),
      new Promise<null>(resolve => { timer = setTimeout(() => { controller.abort(); resolve(null); }, budget); }),
    ]);
    const text = selectApproved(approved, response);
    return text ? { ...fallback, source: 'approved-selection', text } : fallback;
  } catch { return fallback; }
  finally { if (timer) clearTimeout(timer); controller.abort(); }
}
