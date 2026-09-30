import type { Action, ReasonCode, RuleId, Signal, Snapshot } from '@/lib/types';
import { formatCents, formatDate } from '@/components/format';

export const ruleLabel: Record<RuleId, string> = {
  'clarify-intent': 'Ask about upcoming plans',
  'moving-reserve': 'Keep money available for the move',
  'coverage-check': 'Check existing cover',
  'explore-investment': 'Explore a long-term simulation',
};

/** Human-language reason for each trace row. Display only; the engine owns the decision. */
export const reasonText: Record<ReasonCode, string> = {
  INTENT_UNKNOWN: 'Kate does not know what this money is for yet, so she asks first.',
  INTENT_CONFIRMED: 'Shay already told Kate her plans, so there is no need to ask again.',
  NO_MOVE_CONFIRMED: 'No move has been confirmed, so moving steps do not apply.',
  NEAR_TERM_COMMITMENT: 'A near-term commitment comes first; investing is not suggested now.',
  RESERVE_REVIEW_REQUIRED: 'A new commitment changed the money picture; the reserve needs a review.',
  RESERVE_REVIEW_PENDING: 'Waiting until the moving reserve has been reviewed.',
  ACTION_COMPLETED: 'This step is done and stays done.',
  ACTION_DISMISSED: 'Shay dismissed this step; Kate does not push it again.',
  COVERAGE_UNKNOWN: 'Kate does not know whether the new home is already covered.',
  COVERAGE_CONFIRMED: 'Shay reported cover elsewhere (customer-reported, not verified).',
  COVERAGE_HELP_REQUESTED: 'Shay said she needs cover; noted for information only.',
  LONG_TERM_ELIGIBLE: 'Long-term goal confirmed and demo checks passed, so a simulation can be shown.',
  INSUFFICIENT_AVAILABLE_CASH: 'Not enough potentially available cash.',
  PROFILE_INCOMPLETE: 'The synthetic investment profile is incomplete.',
  HORIZON_TOO_SHORT: 'The time horizon is too short for this scenario.',
  STALE_OR_MISSING_DATA: 'Some data is missing or out of date, so Kate holds back.',
  CONFLICTING_DATA: 'Some facts conflict; Kate needs a clarification first.',
  PROACTIVE_PAUSED: 'Shay paused suggestions.',
  LOWER_PRIORITY: 'Another step is more important right now.',
};

export const outcomeLabel = { selected: 'Selected', deferred: 'Deferred', suppressed: 'Suppressed' } as const;

const signalLabels: Record<string, string> = {
  cash: 'Accessible cash', reserve: 'Emergency reserve', expenses: 'Upcoming expenses',
  'regular-income': 'Regular income pattern', profile: 'Investment profile', 'moving-plan': 'Moving plan',
  intent: 'What the money is for', horizon: 'Time horizon', 'commitments-confirmed': 'No other commitments',
  coverage: 'Home cover',
};

export const kindLabel: Record<Signal['kind'], string> = {
  observed: 'Observed', inferred: 'Inferred', 'customer-confirmed': 'You told Kate',
};

const moneySignals = new Set(['cash', 'reserve', 'expenses', 'moving-plan']);

export function describeSignal(signal: Signal): { label: string; value: string } {
  const label = signalLabels[signal.key] ?? signal.key;
  let value: string;
  if (typeof signal.value === 'number' && moneySignals.has(signal.key)) value = formatCents(signal.value);
  else if (signal.key === 'horizon' && typeof signal.value === 'number') value = `${signal.value} years`;
  else if (signal.key === 'intent') value = signal.value === 'near-term' ? 'A near-term plan' : signal.value === 'long-term' ? 'A long-term goal' : String(signal.value);
  else if (typeof signal.value === 'boolean') value = signal.value ? 'Confirmed' : 'Not confirmed';
  else value = String(signal.value);
  return { label, value };
}

export const byRule = (snapshot: Snapshot, rule: RuleId): Action | undefined =>
  snapshot.actions.find(a => a.ruleId === rule);

export type StepState = 'done' | 'current' | 'upcoming';

/** Moving plan steps, derived only from shared actions/context (never separate page state). */
export function movingSteps(snapshot: Snapshot): { id: string; title: string; detail: string; state: StepState }[] {
  const { context, decision } = snapshot;
  const move = context.commitments.find(c => c.purpose === 'moving');
  const reserve = byRule(snapshot, 'moving-reserve');
  const coverage = byRule(snapshot, 'coverage-check');
  const stateOf = (a?: Action): StepState =>
    a?.status === 'completed' ? 'done' : a && a.id === decision.primaryActionId ? 'current' : 'upcoming';
  const coverageDetail = context.coverageSource === 'customer-reported-external'
    ? 'You reported cover elsewhere (not verified by KBC).'
    : context.coverageSource === 'customer-reported-need' ? 'You said you need cover. Noted for information.'
      : 'Tell Kate what you already have.';
  const reserveState = stateOf(reserve);
  const coverageState = stateOf(coverage);
  return [
    { id: 'confirm', title: 'Confirm your move', state: move ? 'done' : 'current',
      detail: move ? `${formatCents(move.amountCents)} by ${formatDate(move.dueDate)}` : 'Tell Kate the date and remaining cost.' },
    { id: 'reserve', title: 'Plan the money', state: reserveState,
      detail: reserveState === 'done' ? 'Reserve plan acknowledged. No money moved.' : 'Review the amount to keep available.' },
    { id: 'cover', title: 'Check existing cover', state: coverageState, detail: coverageDetail },
    { id: 'reuse', title: 'Reuse your answers', state: reserveState === 'done' && coverageState === 'done' ? 'done' : 'upcoming',
      detail: 'Home and Kate share the same answers, so you are not asked twice.' },
  ];
}
