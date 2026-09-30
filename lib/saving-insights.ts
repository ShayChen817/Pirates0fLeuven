import { getSavingInsightsSeed } from '../data/saving-insights-fixtures.ts';
import { isMoney } from './context.ts';
import { exactKeys, positiveInteger, record, safeId } from './validation.ts';
import type { InvestmentIllustration, SavingInsightsResult, SavingInsightsSeed, SavingInsightsService, SavingInsightsSnapshot } from './saving-insights-types.ts';

/** Constant hypothetical annual effective rate, end-of-month contributions; no fees/tax/inflation. */
export function projectMonthlyIllustration(monthlyCents: number, annualRatePercent: number, years: number): number {
  if (!isMoney(monthlyCents) || !Number.isFinite(annualRatePercent) || annualRatePercent <= -100 || annualRatePercent > 100 ||
    !positiveInteger(years) || years > 100) throw new Error('Invalid illustration inputs.');
  const months = years * 12;
  const monthlyRate = Math.pow(1 + annualRatePercent / 100, 1 / 12) - 1;
  const value = Math.round(monthlyCents * (monthlyRate === 0 ? months : ((1 + monthlyRate) ** months - 1) / monthlyRate));
  if (!isMoney(value)) throw new Error('Illustration exceeds supported precision.');
  return value;
}
function illustrate(): InvestmentIllustration {
  // DEMO: a separate hypothetical budget. Never reuses the Japan contribution or the €13 intention.
  const monthlyCents = 10000, years = 10;
  return { monthlyCents, years, contributedCents: monthlyCents * years * 12,
    scenarios: [
      { label: 'Declining market', annualRatePercent: -4 },
      { label: 'Flat market', annualRatePercent: 0 },
      { label: 'Growing market', annualRatePercent: 4 },
    ].map(s => ({ ...s, valueCents: projectMonthlyIllustration(monthlyCents, s.annualRatePercent, years) })) };
}
function validateSeed(seed: SavingInsightsSeed) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(seed.period) || !isMoney(seed.emergencyFundCents) || !positiveInteger(seed.bufferTargetCents) ||
    !Array.isArray(seed.spending) || seed.spending.length > 20 || new Set(seed.spending.map(s => s.id)).size !== seed.spending.length ||
    !seed.spending.every(s => safeId(s.id) && typeof s.label === 'string' && s.label.trim().length > 0 && s.label.length <= 80 && isMoney(s.cents) && (s.highlight === undefined || typeof s.highlight === 'boolean')) ||
    !isMoney(seed.spending.reduce((sum, s) => sum + s.cents, 0))) throw new Error('Invalid insights seed.');
}
function evaluate(state: SavingInsightsSnapshot): SavingInsightsSnapshot {
  const bufferFunded = state.emergencyFundCents >= state.bufferTargetCents;
  return { ...state, bufferFunded, bufferGapCents: Math.max(0, state.bufferTargetCents - state.emergencyFundCents),
    spendingTotalCents: state.spending.reduce((sum, s) => sum + s.cents, 0),
    illustration: bufferFunded && state.longTermRequested ? illustrate() : null };
}
export function createSavingInsightsService(seed: SavingInsightsSeed = getSavingInsightsSeed()): SavingInsightsService {
  validateSeed(seed);
  const initial = structuredClone(seed);
  const fresh = (): SavingInsightsSnapshot => evaluate({ ...structuredClone(initial), contractVersion: 'saving-insights-1.0', revision: 1,
    spendingTotalCents: 0, bufferGapCents: 0, bufferFunded: false, longTermRequested: false, illustration: null });
  let current = fresh();
  const read = () => structuredClone(current);
  const fail = (code: 'INVALID_EVENT' | 'REVISION_CONFLICT' | 'ACTION_NOT_AVAILABLE', message: string): SavingInsightsResult =>
    ({ ok: false, error: { code, message }, snapshot: read() });
  return {
    async getSnapshot() { return read(); },
    async dispatch(request) {
      if (!record(request) || !exactKeys(request, ['expectedRevision', 'event']) || !positiveInteger(request.expectedRevision) || !record(request.event))
        return fail('INVALID_EVENT', 'Supply a revision and an insight event.');
      if (request.expectedRevision !== current.revision) return fail('REVISION_CONFLICT', 'Your overview changed. Review it and try again.');
      if (current.revision === Number.MAX_SAFE_INTEGER) return fail('INVALID_EVENT', 'Start a new demo session.');
      const event = request.event;
      let next = structuredClone(current);
      if (event.type === 'SET_DEMO_FUNDED' && exactKeys(event, ['type', 'funded']) && typeof event.funded === 'boolean') {
        // A presenter-only fixture change. It must not be displayed as a bank transfer.
        next.emergencyFundCents = event.funded ? initial.bufferTargetCents : initial.emergencyFundCents;
        next.longTermRequested = false;
      } else if (event.type === 'REQUEST_LONG_TERM_EXAMPLE' && exactKeys(event, ['type'])) {
        if (!next.bufferFunded) return fail('ACTION_NOT_AVAILABLE', 'The demo buffer target has not been reached.');
        next.longTermRequested = true;
      } else if (event.type === 'RESET_DEMO' && exactKeys(event, ['type'])) {
        next = fresh();
      } else return fail('INVALID_EVENT', 'Unsupported insight event.');
      current = evaluate({ ...next, revision: current.revision + 1 });
      return { ok: true, snapshot: read() };
    },
  };
}
