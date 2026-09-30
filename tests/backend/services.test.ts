import assert from 'node:assert/strict';
import { test } from 'node:test';
import { demoTransitions, getDemoSnapshot } from '../../data/demo-fixtures.ts';
import { getSavingDemoSeed, savingGolden } from '../../data/saving-fixtures.ts';
import { createMomentsService } from '../../lib/service.ts';
import { availableCash } from '../../lib/context.ts';
import { evaluateSnapshot } from '../../lib/engine.ts';
import { createSavingService, detectSubscriptions, projectGoal } from '../../lib/saving.ts';
import type { CustomerEvent, MomentsService } from '../../lib/types.ts';
import type { SavingEvent, SavingService } from '../../lib/saving-types.ts';

async function send(service: MomentsService, event: CustomerEvent) {
  const result = await service.dispatch({ expectedRevision: (await service.getSnapshot()).revision, event });
  assert(result.ok, JSON.stringify(result)); return result.snapshot;
}
async function save(service: SavingService, event: SavingEvent) {
  const result = await service.dispatch({ expectedRevision: (await service.getSnapshot()).revision, event });
  assert(result.ok, JSON.stringify(result)); return result.snapshot;
}
const move: CustomerEvent = { type: 'CONFIRM_MOVING', commitment: { id: 'moving-2026-10', amountCents: 250000, dueDate: '2026-11-01', purpose: 'moving' } };
const long: CustomerEvent = { type: 'CONFIRM_LONG_TERM', horizonYears: 7, noAdditionalCommitments: true };

for (const transition of demoTransitions) {
  test(`Moving golden transition: ${transition.from} -> ${transition.to}`, async () => {
    const service = createMomentsService(getDemoSnapshot(transition.from));
    const result = await service.dispatch(transition.request); assert(result.ok);
    const actual = result.snapshot, expected = getDemoSnapshot(transition.to);
    assert.equal(actual.revision, expected.revision);
    assert.equal(actual.context.version, expected.context.version);
    assert.equal(actual.availableCashCents, expected.availableCashCents);
    assert.equal(actual.decision.primaryActionId, expected.decision.primaryActionId);
    for (const key of ['intent', 'coverage', 'coverageSource', 'horizonYears', 'accessibleCashCents', 'commitmentsConfirmed'] as const) {
      assert.equal(actual.context[key], expected.context[key]);
    }
    assert.deepEqual(actual.context.commitments, expected.context.commitments);
    for (const action of expected.actions) {
      const found = actual.actions.find(item => item.id === action.id); assert(found);
      assert.equal(found.status, action.status); assert.equal(found.amountCents, action.amountCents);
    }
    for (const row of expected.decision.trace) {
      const found = actual.decision.trace.find(item => item.ruleId === row.ruleId); assert(found);
      assert.equal(found.outcome, row.outcome); assert.equal(found.reasonCode, row.reasonCode);
    }
  });
}

test('Moving service is isolated and cannot be mutated through returned snapshots', async () => {
  const first = createMomentsService(), second = createMomentsService();
  const view = await first.getSnapshot(); view.context.reserveCents = 0; view.actions.length = 0;
  assert.equal((await first.getSnapshot()).context.reserveCents, 400000);
  await send(first, move);
  assert.equal((await second.getSnapshot()).revision, 1);
});
test('stale requests, repeated confirmations and conflicting simultaneous revisions are rejected', async () => {
  const service = createMomentsService();
  const [a, b] = await Promise.all([service.dispatch({ expectedRevision: 1, event: move }), service.dispatch({ expectedRevision: 1, event: long })]);
  assert(a.ok); assert(!b.ok); assert.equal(b.error.code, 'REVISION_CONFLICT');
  assert.equal((await service.getSnapshot()).availableCashCents, 35000);
  const initial = createMomentsService(); await send(initial, long);
  const invested = await send(initial, { type: 'CONFIRM_SIMULATION', actionId: 'lotte:explore-investment', amountCents: 140000 });
  assert.equal(invested.context.accessibleCashCents, 785000);
  const retry = await initial.dispatch({ expectedRevision: invested.revision, event: { type: 'CONFIRM_SIMULATION', actionId: 'lotte:explore-investment', amountCents: 140000 } });
  assert(!retry.ok); assert.equal(retry.error.code, 'ACTION_NOT_AVAILABLE');
});
test('invalid inputs cannot mutate balances, action status or revision', async () => {
  const service = createMomentsService(); const before = await service.getSnapshot();
  const events = [null, { type: 'RESET_DEMO', balance: 0 }, { type: 'SET_PROACTIVE', enabled: 'false' },
    { ...move, commitment: { id: 'x', amountCents: -1, dueDate: '2026-11-01', purpose: 'moving' } },
    { ...move, commitment: { id: 'x', amountCents: 1.5, dueDate: '2026-11-01', purpose: 'moving' } },
    { ...move, commitment: { id: 'x', amountCents: 100, dueDate: '2026-02-30', purpose: 'moving' } }];
  for (const event of events) {
    const response = await service.dispatch({ expectedRevision: 1, event: event as CustomerEvent });
    assert(!response.ok); assert.equal(response.error.code, 'INVALID_EVENT');
    assert.deepEqual(await service.getSnapshot(), before);
  }
});
test('reserve acknowledgement retains cash commitment; coverage clear, pause and reset stay coherent', async () => {
  const service = createMomentsService(); await send(service, move);
  let state = await send(service, { type: 'ACKNOWLEDGE_RESERVE', actionId: 'lotte:moving-reserve' });
  assert.equal(state.availableCashCents, 35000);
  state = await send(service, { type: 'REPORT_COVERAGE', coverage: 'confirmed-covered' }); assert.equal(state.decision.primaryActionId, null);
  state = await send(service, { type: 'CLEAR_CONTEXT', field: 'coverage' }); assert.equal(state.decision.primaryActionId, 'lotte:coverage-check');
  state = await send(service, { type: 'SET_PROACTIVE', enabled: false }); assert.equal(state.decision.primaryActionId, null);
  state = await send(service, { type: 'SET_PROACTIVE', enabled: true }); assert.equal(state.decision.primaryActionId, 'lotte:coverage-check');
  const version = state.context.version, revision = state.revision;
  state = await send(service, { type: 'RESET_DEMO' });
  assert.equal(state.revision, revision + 1); assert.equal(state.context.version, version + 1); assert.equal(state.availableCashCents, 285000);
});
test('dismissal survives rerender and pause; material plan edit reopens reserve', async () => {
  const service = createMomentsService(); await send(service, move);
  let state = await send(service, { type: 'DISMISS_ACTION', actionId: 'lotte:moving-reserve' });
  assert.equal(state.decision.primaryActionId, null);
  assert.equal(evaluateSnapshot(state).decision.primaryActionId, null);
  await send(service, { type: 'SET_PROACTIVE', enabled: false });
  state = await send(service, { type: 'SET_PROACTIVE', enabled: true }); assert.equal(state.decision.primaryActionId, null);
  state = await send(service, { type: 'CONFIRM_MOVING', commitment: { id: 'moving-2026-10', amountCents: 240000, dueDate: '2026-11-01', purpose: 'moving' } });
  assert.equal(state.decision.primaryActionId, 'lotte:moving-reserve'); assert.equal(state.availableCashCents, 45000);
});
test('stale cash, short horizon and incomplete profile block investment; duplicate commitments are not double counted', async () => {
  const stale = getDemoSnapshot('investing'); stale.context.signals.find(s => s.id === 'cash')!.validUntil = stale.context.asOf;
  assert.notEqual(evaluateSnapshot(stale).decision.primaryActionId, 'lotte:explore-investment');
  const incomplete = getDemoSnapshot('investing'); incomplete.context.profileComplete = false;
  assert.equal(evaluateSnapshot(incomplete).decision.primaryActionId, null);
  const short = createMomentsService(); const state = await send(short, { ...long, horizonYears: 2 } as CustomerEvent);
  assert.equal(state.decision.primaryActionId, null);
  const duplicate = getDemoSnapshot('moving').context;
  duplicate.commitments.push(structuredClone(duplicate.commitments[0])); assert.equal(availableCash(duplicate), 35000);
  duplicate.commitments[1].amountCents = 1; assert.throws(() => availableCash(duplicate));
});
test('larger than available investment and conflicting moving/long-term plans do not mutate state', async () => {
  const service = createMomentsService(); await send(service, long);
  const before = await service.getSnapshot();
  const result = await service.dispatch({ expectedRevision: before.revision, event: { type: 'CONFIRM_SIMULATION', actionId: 'lotte:explore-investment', amountCents: 300000 } });
  assert(!result.ok); assert.equal(result.error.code, 'NOT_ELIGIBLE'); assert.deepEqual(await service.getSnapshot(), before);
  await send(service, move); const moved = await service.getSnapshot();
  const rejected = await service.dispatch({ expectedRevision: moved.revision, event: long });
  assert(!rejected.ok); assert.deepEqual(await service.getSnapshot(), moved);
});

test('Japan subscription intention changes projection, not achieved savings', async () => {
  const service = createSavingService(); let state = await service.getSnapshot();
  assert.equal(state.subscriptions.length, 3);
  assert.equal(state.baseline.completionDate, savingGolden.initial.completionDate);
  assert.equal(state.baseline.deadlineBalanceCents, savingGolden.initial.deadlineBalanceCents);
  state = await save(service, { type: 'REVIEW_SUBSCRIPTION', merchantId: 'stream-a', decision: 'unused' });
  assert.equal(state.primary?.type, 'saving-intention');
  state = await save(service, { type: 'ADD_SAVING_INTENTION', merchantId: 'stream-a' });
  assert.equal(state.goal.savedCents, 65000); assert.equal(state.projected.progressPercent, 32.5);
  assert.equal(state.projected.monthlyCents, 13800); assert.equal(state.projected.completionDate, '2027-08-01');
  assert.equal(state.projected.deadlineBalanceCents, 203000); assert.equal(state.projected.contributionsNeeded, 10);
  assert.equal(state.primary, null);
});
test('a customer must confirm unused service; keep and remove undo only future intention', async () => {
  const service = createSavingService();
  const bad = await service.dispatch({ expectedRevision: 1, event: { type: 'ADD_SAVING_INTENTION', merchantId: 'stream-a' } }); assert(!bad.ok);
  await save(service, { type: 'REVIEW_SUBSCRIPTION', merchantId: 'stream-a', decision: 'unused' });
  await save(service, { type: 'ADD_SAVING_INTENTION', merchantId: 'stream-a' });
  let state = await save(service, { type: 'REVIEW_SUBSCRIPTION', merchantId: 'stream-a', decision: 'keep' });
  assert.equal(state.intentions.length, 0); assert.equal(state.primary, null); assert.equal(state.goal.savedCents, 65000);
  assert.equal(state.projected.completionDate, '2027-09-01');
  state = await save(service, { type: 'RESET_DEMO' }); assert(state.primary); assert.equal(state.revision, 5);
});
test('only separately recorded contributions increase progress, duplicate IDs are rejected', async () => {
  const service = createSavingService(); const event: SavingEvent = { type: 'RECORD_CONTRIBUTION', contributionId: 'demo-deposit-1', amountCents: 12500 };
  const state = await save(service, event); assert.equal(state.goal.savedCents, 77500);
  const duplicate = await service.dispatch({ expectedRevision: state.revision, event }); assert(!duplicate.ok);
  assert.equal((await service.getSnapshot()).goal.savedCents, 77500);
});
test('subscription pattern is deduplicated and does not confuse irregular purchases with monthly charges', () => {
  const seed = getSavingDemoSeed();
  assert.equal(detectSubscriptions(seed.purchases.concat(seed.purchases), seed.asOf).length, 3);
  seed.purchases[0].amountCents = 1400;
  assert.equal(detectSubscriptions(seed.purchases, seed.asOf).length, 2);
  const clone = structuredClone(seed.purchases[0]); clone.amountCents = 99;
  assert.throws(() => detectSubscriptions([...seed.purchases, clone], seed.asOf));
});
test('zero contributions, achieved goals and month-end projections are explicit', () => {
  const goal = getSavingDemoSeed().goal;
  assert.equal(projectGoal({ ...goal, monthlyContributionCents: 0 }).completionDate, null);
  assert.equal(projectGoal({ ...goal, savedCents: 200000 }).contributionsNeeded, 0);
  assert.equal(projectGoal({ ...goal, savedCents: 0, targetCents: 30000, monthlyContributionCents: 10000,
    firstContributionDate: '2027-01-31' }).completionDate, '2027-03-31');
});
test('saving revision conflicts, pause and malformed goal updates preserve authoritative state', async () => {
  const service = createSavingService(); const initial = await service.getSnapshot();
  initial.goal.savedCents = 0; assert.equal((await service.getSnapshot()).goal.savedCents, 65000);
  await save(service, { type: 'SET_PROACTIVE', enabled: false });
  assert.equal((await service.getSnapshot()).primary, null);
  const stale = await service.dispatch({ expectedRevision: 1, event: { type: 'RESET_DEMO' } }); assert(!stale.ok);
  const before = await service.getSnapshot();
  const bad = await service.dispatch({ expectedRevision: before.revision, event: { type: 'UPDATE_GOAL', title: 'Japan', targetCents: 200000,
    deadline: '2027-02-30', monthlyContributionCents: 100, firstContributionDate: '2026-11-01' } });
  assert(!bad.ok); assert.deepEqual(await service.getSnapshot(), before);
});
