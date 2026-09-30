import type { Action, CustomerContext, Decision, ReasonCode, RuleId, Snapshot } from './types.ts';
import { availableCash, contextIssue, formatEuro, profileIsCurrent, suggestedAmount, uniqueCommitments } from './context.ts';

export const RULE_IDS: RuleId[] = ['clarify-intent', 'moving-reserve', 'coverage-check', 'explore-investment'];
const idFor = (context: CustomerContext, rule: RuleId) => `${context.customerId}:${rule}`;

function makeAction(context: CustomerContext, rule: RuleId, reason: ReasonCode, available: number): Action {
  const evidenceIds = (ids: string[]) => ids.filter(id => context.signals.some(signal => signal.id === id));
  const base = { id: idFor(context, rule), customerId: context.customerId, ruleId: rule,
    contextVersion: context.version, status: 'pending' as const, reasonCodes: [reason] };
  switch (rule) {
    case 'clarify-intent': return { ...base, domain: 'planning', title: 'What is this money for?',
      message: reason === 'STALE_OR_MISSING_DATA' || reason === 'CONFLICTING_DATA'
        ? 'Some information needs to be checked before a suggestion can be made. Review the evidence and update your plans.'
        : `Based on known expenses and reserves, ${formatEuro(available)} may be available. Any other large expenses coming up?`,
      cta: 'Review my plans', evidenceIds: evidenceIds(['cash', 'reserve', 'expenses']) };
    case 'moving-reserve': {
      const amount = uniqueCommitments(context.commitments).filter(item => item.purpose === 'moving').reduce((sum, item) => sum + item.amountCents, 0);
      return { ...base, domain: 'planning', title: `Plan for ${formatEuro(amount)} of moving costs`,
        message: `With your moving commitment included, ${formatEuro(available)} remains potentially available. Acknowledgement records a plan; no money moves.`,
        cta: 'Acknowledge reserve plan', amountCents: amount, evidenceIds: evidenceIds(['cash', 'reserve', 'expenses', 'moving-plan']) };
    }
    case 'coverage-check': return { ...base, domain: 'insurance', title: 'Check your existing cover',
      message: 'You may already be covered through another provider. Tell Kate what you know.', cta: 'Review coverage',
      evidenceIds: evidenceIds(['moving-plan']) };
    case 'explore-investment': {
      const amount = suggestedAmount(available);
      return { ...base, domain: 'investing', title: 'Explore a long-term scenario',
        message: `An illustrative ${formatEuro(amount)} simulation leaves ${formatEuro(available - amount)} of the potentially available cash flexible. No money moves.`,
        cta: 'Review simulation', amountCents: amount, evidenceIds: evidenceIds(['cash', 'reserve', 'expenses', 'intent', 'horizon', 'profile']) };
    }
  }
}

/** Pure evaluation. Historical resolved actions survive; pending offers are always re-evaluated. */
export function evaluateSnapshot(input: Snapshot): Snapshot {
  const snapshot = structuredClone(input);
  const context = snapshot.context;
  let available = 0;
  try { available = availableCash(context); } catch { /* invalid cash is quarantined by contextIssue */ }
  snapshot.availableCashCents = available;
  const previous = new Map(snapshot.actions.map(action => [action.ruleId, action]));
  const trace: Decision['trace'] = [];
  const issue = contextIssue(context);
  const moved = context.commitments.some(item => item.purpose === 'moving');
  let primary: Action | null = null;
  function row(ruleId: RuleId, outcome: Decision['trace'][number]['outcome'], reasonCode: ReasonCode, evidenceIds: string[] = []) {
    trace.push({ ruleId, outcome, reasonCode, evidenceIds: evidenceIds.filter(id => context.signals.some(signal => signal.id === id)) });
  }
  function resolved(rule: RuleId): boolean {
    const status = previous.get(rule)?.status;
    if (status === 'completed' || status === 'dismissed') {
      row(rule, 'suppressed', status === 'completed' ? 'ACTION_COMPLETED' : 'ACTION_DISMISSED');
      return true;
    }
    return false;
  }
  function select(rule: RuleId, reason: ReasonCode, evidence: string[]) {
    if (primary) { row(rule, 'deferred', 'LOWER_PRIORITY', evidence); return; }
    primary = makeAction(context, rule, reason, available);
    row(rule, 'selected', reason, evidence);
  }
  if (!context.proactiveEnabled) {
    RULE_IDS.forEach(rule => row(rule, 'suppressed', 'PROACTIVE_PAUSED'));
  } else {
    if (issue) select('clarify-intent', issue, ['cash', 'reserve', 'expenses']);
    else if (context.intent === 'unknown' || !context.commitmentsConfirmed) {
      if (!resolved('clarify-intent')) select('clarify-intent', 'INTENT_UNKNOWN', ['cash', 'reserve', 'expenses']);
    } else row('clarify-intent', 'suppressed', 'INTENT_CONFIRMED', ['intent']);

    if (!moved) row('moving-reserve', 'suppressed', 'NO_MOVE_CONFIRMED');
    else if (issue) row('moving-reserve', 'deferred', issue, ['moving-plan']);
    else if (!resolved('moving-reserve')) select('moving-reserve', 'RESERVE_REVIEW_REQUIRED', ['moving-plan']);

    if (!moved) row('coverage-check', 'suppressed', 'NO_MOVE_CONFIRMED');
    else if (issue) row('coverage-check', 'deferred', issue);
    else if (context.coverage !== 'unknown') row('coverage-check', 'suppressed',
      context.coverage === 'confirmed-covered' ? 'COVERAGE_CONFIRMED' : 'COVERAGE_HELP_REQUESTED', ['coverage']);
    else if (previous.get('moving-reserve')?.status !== 'completed') row('coverage-check', 'deferred', 'RESERVE_REVIEW_PENDING', ['moving-plan']);
    else if (!resolved('coverage-check')) select('coverage-check', 'COVERAGE_UNKNOWN', ['moving-plan']);

    if (issue) row('explore-investment', 'deferred', issue);
    else if (moved || context.intent === 'near-term') row('explore-investment', 'suppressed', 'NEAR_TERM_COMMITMENT', ['moving-plan']);
    else if (context.intent === 'unknown' || !context.commitmentsConfirmed) row('explore-investment', 'deferred', 'INTENT_UNKNOWN');
    else if (!profileIsCurrent(context)) row('explore-investment', 'deferred', 'PROFILE_INCOMPLETE', ['profile']);
    else if (context.horizonYears === null || !Number.isFinite(context.horizonYears) || context.horizonYears < 5) row('explore-investment', 'suppressed', 'HORIZON_TOO_SHORT', ['horizon']);
    else if (available < 100000) row('explore-investment', 'suppressed', 'INSUFFICIENT_AVAILABLE_CASH', ['cash', 'reserve', 'expenses']);
    else if (!resolved('explore-investment')) select('explore-investment', 'LONG_TERM_ELIGIBLE', ['intent', 'horizon', 'profile']);
  }
  snapshot.actions = snapshot.actions.map(action => action.status === 'pending' ? { ...action, status: 'invalidated' as const } : action);
  // TypeScript cannot track assignments made inside the local select helper.
  const selected = primary as Action | null;
  if (selected) {
    const index = snapshot.actions.findIndex(action => action.id === selected.id);
    if (index < 0) snapshot.actions.push(selected); else snapshot.actions[index] = selected;
  }
  snapshot.decision = { primaryActionId: selected?.id ?? null, trace };
  return snapshot;
}
