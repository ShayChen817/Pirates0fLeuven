import { getRecognitionDemoSeed } from '../data/recognition-fixtures.ts';
import { exactKeys, positiveInteger, record, safeId } from './validation.ts';
import type { Purchase } from './saving-types.ts';
import type { RecognitionEvent, RecognitionFeedback, RecognitionPreferences, RecognitionResult, RecognitionSeed, RecognitionService, RecognitionSnapshot } from './recognition-types.ts';

const DAY = 86400000;
/** Pure signal evaluator; asOf is explicit so TTLs are reproducible and testable. */
export function evaluateRecognition(seed: RecognitionSeed, preferences: RecognitionPreferences,
  feedback: RecognitionFeedback[] = [], revision = 1): RecognitionSnapshot {
  const now = Date.parse(seed.asOf);
  if (!Number.isFinite(now)) throw new Error('Invalid recognition clock.');
  const result: RecognitionSnapshot = { contractVersion: 'recognition-1.0', revision, asOf: seed.asOf,
    preferences: structuredClone(preferences), hypothesis: null,
    confirmedMission: feedback.some(item => item.decision === 'confirm') ? 'moving' : null,
    feedback: structuredClone(feedback), trace: { reasonCode: 'INSUFFICIENT_EVIDENCE', evidenceIds: [], locationUsed: false } };
  if (result.confirmedMission) { result.trace.reasonCode = 'MISSION_CONFIRMED'; return result; }
  if (!preferences.purchaseHistory) { result.trace.reasonCode = 'PURCHASE_SOURCE_DISABLED'; return result; }
  const unique = new Map<string, Purchase>();
  for (const purchase of seed.purchases) {
    if (!safeId(purchase.id) || !safeId(purchase.merchantId) || !positiveInteger(purchase.amountCents) ||
      purchase.currency !== 'EUR' || !Number.isFinite(Date.parse(purchase.postedAt))) throw new Error('Invalid recognition purchase.');
    const previous = unique.get(purchase.id);
    if (previous && (previous.merchantId !== purchase.merchantId || previous.category !== purchase.category ||
      previous.amountCents !== purchase.amountCents || previous.postedAt !== purchase.postedAt || previous.channel !== purchase.channel)) throw new Error('Conflicting purchase IDs.');
    unique.set(purchase.id, purchase);
  }
  const relevant = [...unique.values()].filter(purchase => {
    const age = now - Date.parse(purchase.postedAt);
    return age >= 0 && age <= 14 * DAY && (purchase.category === 'furniture' || purchase.category === 'moving-service');
  });
  if (!relevant.some(item => item.category === 'furniture') || !relevant.some(item => item.category === 'moving-service')) return result;
  const evidenceIds = relevant.map(item => item.id).sort();
  const id = `moving:${evidenceIds.join('|')}`;
  const suppression = feedback.some(item => item.hypothesisId === id && item.decision !== 'confirm' &&
    now >= Date.parse(item.at) && now - Date.parse(item.at) < 30 * DAY);
  if (suppression) { result.trace = { reasonCode: 'RECENT_FEEDBACK', evidenceIds, locationUsed: false }; return result; }
  const location = seed.location;
  const age = location ? now - Date.parse(location.observedAt) : Infinity;
  const cityContext = preferences.location && location?.source === 'device-coarse' && typeof location.city === 'string' &&
    location.city.length > 0 && location.city.length <= 100 && age >= 0 && age < DAY ? location.city : null;
  result.hypothesis = { id, mission: 'moving', status: 'possible', evidenceIds,
    title: 'Are you preparing a move?',
    question: 'You have recent furniture and moving-service payments. Are you preparing a move? I can help you plan the remaining costs.',
    cityContext, reasonCode: 'RELATED_MOVING_PURCHASES' };
  result.trace = { reasonCode: 'POSSIBLE_MOVE', evidenceIds, locationUsed: cityContext !== null };
  return result;
}
function validEvent(value: unknown): value is RecognitionEvent {
  if (!record(value)) return false;
  switch (value.type) {
    case 'SET_SOURCES': return exactKeys(value, ['type', 'purchaseHistory', 'location']) && typeof value.purchaseHistory === 'boolean' && typeof value.location === 'boolean';
    case 'RECORD_FEEDBACK': return exactKeys(value, ['type', 'hypothesisId', 'decision']) && typeof value.hypothesisId === 'string' &&
      value.hypothesisId.length <= 10000 && ['confirm', 'reject', 'later'].includes(String(value.decision));
    case 'CLEAR_CONFIRMED_MISSION': case 'RESET_DEMO': return exactKeys(value, ['type']);
    default: return false;
  }
}
export function createRecognitionService(seed: RecognitionSeed = getRecognitionDemoSeed()): RecognitionService {
  const localSeed = structuredClone(seed);
  // DEMO: synthetic purchase use enabled; optional device location disabled by default.
  let current = evaluateRecognition(localSeed, { purchaseHistory: true, location: false });
  const read = () => structuredClone(current);
  const error = (code: 'INVALID_EVENT' | 'REVISION_CONFLICT' | 'ACTION_NOT_AVAILABLE', message: string): RecognitionResult =>
    ({ ok: false, error: { code, message }, snapshot: read() });
  return {
    async getSnapshot() { return read(); },
    async dispatch(request) {
      if (!record(request) || !exactKeys(request, ['expectedRevision', 'event']) || !positiveInteger(request.expectedRevision)) return error('INVALID_EVENT', 'Supply a revision and supported recognition event.');
      if (request.expectedRevision !== current.revision) return error('REVISION_CONFLICT', 'The evidence changed. Review the latest suggestion.');
      if (!validEvent(request.event) || current.revision >= Number.MAX_SAFE_INTEGER) return error('INVALID_EVENT', 'Check the recognition event.');
      const event = request.event;
      let preferences = structuredClone(current.preferences), feedback = structuredClone(current.feedback);
      switch (event.type) {
        case 'SET_SOURCES': preferences = { purchaseHistory: event.purchaseHistory, location: event.location }; break;
        case 'RECORD_FEEDBACK':
          if (current.hypothesis?.id !== event.hypothesisId) return error('ACTION_NOT_AVAILABLE', 'This mission suggestion is no longer active.');
          feedback.push({ hypothesisId: event.hypothesisId, decision: event.decision, at: localSeed.asOf }); break;
        case 'CLEAR_CONFIRMED_MISSION':
          feedback = feedback.map(item => item.decision === 'confirm' ? { ...item, decision: 'reject', at: localSeed.asOf } : item); break;
        case 'RESET_DEMO': preferences = { purchaseHistory: true, location: false }; feedback = []; break;
      }
      current = evaluateRecognition(localSeed, preferences, feedback, current.revision + 1);
      return { ok: true, snapshot: read() };
    },
  };
}
