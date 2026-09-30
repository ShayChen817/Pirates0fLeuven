import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMomentsService } from '../../lib/service.ts';
import { createSavingService } from '../../lib/saving.ts';
import { createRecognitionService } from '../../lib/recognition.ts';
import type { CustomerEvent, MomentsService } from '../../lib/types.ts';
import type { SavingEvent } from '../../lib/saving-types.ts';

async function send(service: MomentsService, event: CustomerEvent) {
  const result = await service.dispatch({ expectedRevision: (await service.getSnapshot()).revision, event });
  assert(result.ok, JSON.stringify(result)); return result.snapshot;
}
async function rejected(service: MomentsService, event: CustomerEvent, code: string) {
  const before = await service.getSnapshot();
  const result = await service.dispatch({ expectedRevision: before.revision, event });
  assert(!result.ok); assert.equal(result.error.code, code);
  assert.deepEqual(await service.getSnapshot(), before);
}
const move: CustomerEvent = { type: 'CONFIRM_MOVING', commitment: { id: 'moving-2026-10', amountCents: 250000, dueDate: '2026-11-01', purpose: 'moving' } };
const covered: CustomerEvent = { type: 'REPORT_COVERAGE', coverage: 'confirmed-covered' };

test('coverage cannot be reported before a move or before the reserve review', async () => {
  const service = createMomentsService();
  await rejected(service, covered, 'ACTION_NOT_AVAILABLE');
  await send(service, move);
  await rejected(service, covered, 'ACTION_NOT_AVAILABLE');
  await send(service, { type: 'ACKNOWLEDGE_RESERVE', actionId: 'shay:moving-reserve' });
  const state = await send(service, covered);
  assert.equal(state.context.coverage, 'confirmed-covered');
  // Still editable after the question closed (CONTRACT.md).
  assert.equal((await send(service, { type: 'REPORT_COVERAGE', coverage: 'confirmed-need' })).context.coverage, 'confirmed-need');
});

test('investment simulation below EUR 100 is not eligible', async () => {
  const service = createMomentsService();
  await send(service, { type: 'CONFIRM_LONG_TERM', horizonYears: 7, noAdditionalCommitments: true });
  await rejected(service, { type: 'CONFIRM_SIMULATION', actionId: 'shay:explore-investment', amountCents: 1 }, 'NOT_ELIGIBLE');
  await rejected(service, { type: 'CONFIRM_SIMULATION', actionId: 'shay:explore-investment', amountCents: 9999 }, 'NOT_ELIGIBLE');
  assert((await send(service, { type: 'CONFIRM_SIMULATION', actionId: 'shay:explore-investment', amountCents: 10000 })).actions.length);
});

test('self-recorded contributions and goal edits cannot fake progress', async () => {
  const service = createSavingService();
  const check = async (event: SavingEvent) => {
    const before = await service.getSnapshot();
    const result = await service.dispatch({ expectedRevision: before.revision, event });
    assert(!result.ok); assert.equal(result.error.code, 'INVALID_EVENT');
    assert.deepEqual(await service.getSnapshot(), before);
  };
  await check({ type: 'RECORD_CONTRIBUTION', contributionId: 'too-much', amountCents: 135001 });
  await check({ type: 'UPDATE_GOAL', title: 'Japan', targetCents: 65000, deadline: '2027-08-01', monthlyContributionCents: 12500, firstContributionDate: '2026-11-01' });
  const before = await service.getSnapshot();
  const ok = await service.dispatch({ expectedRevision: before.revision, event: { type: 'RECORD_CONTRIBUTION', contributionId: 'exact-gap', amountCents: 135000 } });
  assert(ok.ok); assert.equal(ok.snapshot.goal.savedCents, 200000);
});

test('recognition feedback rejects malformed hypothesis IDs without mutation', async () => {
  const service = createRecognitionService(); const before = await service.getSnapshot();
  for (const hypothesisId of ['moving:<script>', 'moving:a|', `moving:${'a'.repeat(3000)}`, 'other:x']) {
    const result = await service.dispatch({ expectedRevision: before.revision, event: { type: 'RECORD_FEEDBACK', hypothesisId, decision: 'confirm' } });
    assert(!result.ok); assert.equal(result.error.code, 'INVALID_EVENT');
  }
  assert.deepEqual(await service.getSnapshot(), before);
});
