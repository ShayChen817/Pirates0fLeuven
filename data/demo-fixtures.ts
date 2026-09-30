// DEMO: synthetic golden examples, not outputs of an implemented decision engine.
import type { Action, CustomerContext, Decision, DemoFixture, DemoTransition, RuleId, Signal, Snapshot } from '../lib/types.ts';

export const DEMO_AS_OF = '2026-10-01T12:00:00.000Z';
const VALID_UNTIL = '2026-11-01T00:00:00.000Z';
const actionId = (rule: RuleId) => `shay:${rule}`;
const signal = (id: string, value: Signal['value'], kind: Signal['kind'] = 'observed'): Signal => ({
  id, key: id, value, kind,
  source: kind === 'customer-confirmed' ? 'Synthetic customer response' : 'Synthetic account fixture',
  observedAt: DEMO_AS_OF, validUntil: VALID_UNTIL,
});
const base: CustomerContext = {
  customerId: 'shay', displayName: 'Shay', version: 1, asOf: DEMO_AS_OF, currency: 'EUR',
  accessibleCashCents: 785000, reserveCents: 400000, expensesCents: 100000,
  commitments: [], commitmentsConfirmed: false,
  monthlyHistory: [
    { month: '2026-07', incomeCents: 280000, essentialSpendingCents: 95000 },
    { month: '2026-08', incomeCents: 280000, essentialSpendingCents: 100000 },
    { month: '2026-09', incomeCents: 280000, essentialSpendingCents: 98000 },
  ],
  signals: [signal('cash', 785000), signal('reserve', 400000, 'customer-confirmed'),
    signal('expenses', 100000), signal('regular-income', 'Three equal monthly income totals', 'inferred'),
    signal('profile', 'Complete neutral synthetic profile')],
  intent: 'unknown', coverage: 'unknown', coverageSource: 'unknown',
  profileComplete: true, horizonYears: null, riskProfile: 'neutral', proactiveEnabled: true,
};
const moving: CustomerContext = {
  ...base, version: 2, intent: 'near-term', commitmentsConfirmed: true,
  commitments: [{ id: 'moving-2026-10', amountCents: 250000, dueDate: '2026-11-01', purpose: 'moving' }],
  signals: [...base.signals, signal('moving-plan', 250000, 'customer-confirmed'),
    signal('intent', 'near-term', 'customer-confirmed')],
};
const covered: CustomerContext = {
  ...moving, version: 3, coverage: 'confirmed-covered', coverageSource: 'customer-reported-external',
  signals: [...moving.signals, signal('coverage', 'Already insured elsewhere', 'customer-confirmed')],
};
const investing: CustomerContext = {
  ...base, version: 2, intent: 'long-term', horizonYears: 7, commitmentsConfirmed: true,
  signals: [...base.signals, signal('intent', 'long-term', 'customer-confirmed'),
    signal('horizon', 7, 'customer-confirmed'), signal('commitments-confirmed', true, 'customer-confirmed')],
};
const action = (ruleId: RuleId, context: CustomerContext, status: Action['status'] = 'pending'): Action => {
  const common = { id: actionId(ruleId), customerId: 'shay', ruleId, contextVersion: context.version, status };
  switch (ruleId) {
    case 'clarify-intent': return { ...common, domain: 'planning', title: 'What is this money for?',
      message: 'Based on known expenses and reserves, €2,850 may be available. Any other large expenses coming up?',
      cta: 'Review my plans', reasonCodes: ['INTENT_UNKNOWN'], evidenceIds: ['cash', 'reserve', 'expenses'] };
    case 'moving-reserve': return { ...common, domain: 'planning', title: 'Keep €2,500 available for your move',
      message: 'With your moving commitment included, €350 remains potentially available. Your investment candidate is suppressed.',
      cta: 'Acknowledge reserve plan', amountCents: 250000,
      reasonCodes: ['RESERVE_REVIEW_REQUIRED'], evidenceIds: ['cash', 'reserve', 'expenses', 'moving-plan'] };
    case 'coverage-check': return { ...common, domain: 'insurance', title: 'Check your existing cover',
      message: 'You may already be covered through another provider. Tell Kate what you know.',
      cta: 'Review coverage', reasonCodes: ['COVERAGE_UNKNOWN'], evidenceIds: ['moving-plan'] };
    case 'explore-investment': return { ...common, domain: 'investing', title: 'Explore a long-term scenario',
      message: 'An illustrative €1,500 simulation leaves €1,350 of the potentially available cash flexible. No money moves.',
      cta: 'Review simulation', amountCents: 150000,
      reasonCodes: ['LONG_TERM_ELIGIBLE'], evidenceIds: ['cash', 'reserve', 'expenses', 'intent', 'horizon', 'profile'] };
  }
};
const trace = (ruleId: RuleId, outcome: Decision['trace'][number]['outcome'],
  reasonCode: Decision['trace'][number]['reasonCode'], evidenceIds: string[] = []): Decision['trace'][number] =>
  ({ ruleId, outcome, reasonCode, evidenceIds });
const completedIntent = (ctx: CustomerContext): Action => ({
  ...action('clarify-intent', ctx, 'completed'), message: 'Your plan has been recorded.',
  reasonCodes: ['INTENT_CONFIRMED'], evidenceIds: ['intent'],
});
const reserveAcknowledged = (): Action => ({ ...action('moving-reserve', moving, 'completed'),
  message: 'You acknowledged the reserve plan. The €2,500 commitment stays in the calculation.',
  reasonCodes: ['ACTION_COMPLETED'] });

export const demoFixtures: DemoFixture[] = [
  { id: 'initial', description: '€2,850 potentially available; ask about intent before investment.', snapshot: {
    contractVersion: '1.0', revision: 1, context: base, availableCashCents: 285000,
    actions: [action('clarify-intent', base)], decision: { primaryActionId: actionId('clarify-intent'), trace: [
      trace('clarify-intent', 'selected', 'INTENT_UNKNOWN', ['cash', 'reserve', 'expenses']),
      trace('moving-reserve', 'suppressed', 'NO_MOVE_CONFIRMED'),
      trace('coverage-check', 'suppressed', 'NO_MOVE_CONFIRMED'),
      trace('explore-investment', 'deferred', 'INTENT_UNKNOWN'),
    ] },
  } },
  { id: 'moving', description: '€350 remains after the additional moving commitment.', snapshot: {
    contractVersion: '1.0', revision: 2, context: moving, availableCashCents: 35000,
    actions: [completedIntent(moving), action('moving-reserve', moving)],
    decision: { primaryActionId: actionId('moving-reserve'), trace: [
      trace('clarify-intent', 'suppressed', 'INTENT_CONFIRMED', ['intent']),
      trace('moving-reserve', 'selected', 'RESERVE_REVIEW_REQUIRED', ['moving-plan']),
      trace('coverage-check', 'deferred', 'RESERVE_REVIEW_PENDING', ['moving-plan']),
      trace('explore-investment', 'suppressed', 'NEAR_TERM_COMMITMENT', ['moving-plan']),
    ] },
  } },
  { id: 'coverage-check', description: 'Reserve acknowledged; coverage unknown.', snapshot: {
    contractVersion: '1.0', revision: 3, context: moving, availableCashCents: 35000,
    actions: [completedIntent(moving), reserveAcknowledged(), action('coverage-check', moving)],
    decision: { primaryActionId: actionId('coverage-check'), trace: [
      trace('clarify-intent', 'suppressed', 'INTENT_CONFIRMED', ['intent']),
      trace('moving-reserve', 'suppressed', 'ACTION_COMPLETED', ['moving-plan']),
      trace('coverage-check', 'selected', 'COVERAGE_UNKNOWN', ['moving-plan']),
      trace('explore-investment', 'suppressed', 'NEAR_TERM_COMMITMENT', ['moving-plan']),
    ] },
  } },
  { id: 'covered', description: 'External insurance reported; no proactive primary action remains.', snapshot: {
    contractVersion: '1.0', revision: 4, context: covered, availableCashCents: 35000,
    actions: [completedIntent(covered), reserveAcknowledged(), {
      ...action('coverage-check', covered, 'completed'), title: 'Coverage answer recorded',
      message: 'You reported that you are insured elsewhere. This has not been independently verified.',
      reasonCodes: ['COVERAGE_CONFIRMED'], evidenceIds: ['coverage'],
    }], decision: { primaryActionId: null, trace: [
      trace('clarify-intent', 'suppressed', 'INTENT_CONFIRMED', ['intent']),
      trace('moving-reserve', 'suppressed', 'ACTION_COMPLETED', ['moving-plan']),
      trace('coverage-check', 'suppressed', 'COVERAGE_CONFIRMED', ['coverage']),
      trace('explore-investment', 'suppressed', 'NEAR_TERM_COMMITMENT', ['moving-plan']),
    ] },
  } },
  { id: 'investing', description: 'Alternate path: confirmed seven-year horizon and €1,500 simulation.', snapshot: {
    contractVersion: '1.0', revision: 2, context: investing, availableCashCents: 285000,
    actions: [completedIntent(investing), action('explore-investment', investing)],
    decision: { primaryActionId: actionId('explore-investment'), trace: [
      trace('clarify-intent', 'suppressed', 'INTENT_CONFIRMED', ['intent']),
      trace('moving-reserve', 'suppressed', 'NO_MOVE_CONFIRMED'),
      trace('coverage-check', 'suppressed', 'NO_MOVE_CONFIRMED'),
      trace('explore-investment', 'selected', 'LONG_TERM_ELIGIBLE', ['intent', 'horizon', 'profile']),
    ] },
  } },
  { id: 'invested', description: 'Simulation confirmed; balance unchanged and no real execution.', snapshot: {
    contractVersion: '1.0', revision: 3, context: investing, availableCashCents: 285000,
    actions: [completedIntent(investing), { ...action('explore-investment', investing, 'completed'),
      title: 'Simulation confirmed', message: 'Your €1,500 simulation is complete. No money has moved.',
      reasonCodes: ['ACTION_COMPLETED'],
    }], decision: { primaryActionId: null, trace: [
      trace('clarify-intent', 'suppressed', 'INTENT_CONFIRMED', ['intent']),
      trace('moving-reserve', 'suppressed', 'NO_MOVE_CONFIRMED'),
      trace('coverage-check', 'suppressed', 'NO_MOVE_CONFIRMED'),
      trace('explore-investment', 'suppressed', 'ACTION_COMPLETED', ['intent']),
    ] },
  } },
];

/** Every caller receives independent mutable state; never mutate the golden fixtures. */
export function getDemoSnapshot(id: DemoFixture['id'] = 'initial'): Snapshot {
  const fixture = demoFixtures.find(item => item.id === id);
  if (!fixture) throw new Error(`Unknown demo fixture: ${id}`);
  return structuredClone(fixture.snapshot);
}

export const demoTransitions: DemoTransition[] = [
  { from: 'initial', request: { expectedRevision: 1, event: { type: 'CONFIRM_MOVING',
    commitment: { id: 'moving-2026-10', amountCents: 250000, dueDate: '2026-11-01', purpose: 'moving' } } }, to: 'moving' },
  { from: 'moving', request: { expectedRevision: 2, event: { type: 'ACKNOWLEDGE_RESERVE', actionId: actionId('moving-reserve') } }, to: 'coverage-check' },
  { from: 'coverage-check', request: { expectedRevision: 3, event: { type: 'REPORT_COVERAGE', coverage: 'confirmed-covered' } }, to: 'covered' },
  { from: 'initial', request: { expectedRevision: 1, event: { type: 'CONFIRM_LONG_TERM', horizonYears: 7, noAdditionalCommitments: true } }, to: 'investing' },
  { from: 'investing', request: { expectedRevision: 2, event: { type: 'CONFIRM_SIMULATION', actionId: actionId('explore-investment'), amountCents: 150000 } }, to: 'invested' },
];
