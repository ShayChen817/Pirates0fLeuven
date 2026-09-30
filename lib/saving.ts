import { getSavingDemoSeed } from '../data/saving-fixtures.ts';
import { formatEuro, isMoney } from './context.ts';
import { exactKeys, positiveInteger, record, safeId, validDate } from './validation.ts';
import type { GoalProjection, Purchase, SavingEvent, SavingGoal, SavingResult, SavingSeed, SavingService, SavingSnapshot, SubscriptionCandidate } from './saving-types.ts';

/** Month-end schedules clamp to the last day, always relative to the original anchor. */
function paymentDate(first: string, offset: number): string {
  const [year, month, day] = first.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}
function checkGoal(goal: SavingGoal, asOf: string) {
  if (!safeId(goal.id) || !goal.title.trim() || goal.title.length > 100 || !positiveInteger(goal.targetCents) ||
    !isMoney(goal.savedCents) || !isMoney(goal.monthlyContributionCents) || !validDate(goal.deadline) || !validDate(goal.firstContributionDate) ||
    goal.deadline < asOf.slice(0, 10) || goal.firstContributionDate <= asOf.slice(0, 10)) throw new Error('Check goal amounts and future contribution dates.');
  if (Date.parse(`${goal.deadline}T00:00:00Z`) - Date.parse(asOf) > 100 * 366 * 86400000) throw new Error('The demo supports deadlines within 100 years.');
}
export function projectGoal(goal: SavingGoal, extraMonthlyCents = 0): GoalProjection {
  if (![goal.targetCents, goal.savedCents, goal.monthlyContributionCents, extraMonthlyCents].every(isMoney) ||
    goal.targetCents === 0 || !validDate(goal.firstContributionDate) || !validDate(goal.deadline)) throw new Error('Invalid projection inputs.');
  const monthlyCents = goal.monthlyContributionCents + extraMonthlyCents;
  if (!Number.isSafeInteger(monthlyCents)) throw new Error('Contribution total exceeds supported precision.');
  const remainingCents = Math.max(0, goal.targetCents - goal.savedCents);
  const needed = remainingCents === 0 ? 0 : monthlyCents > 0 ? Math.ceil(remainingCents / monthlyCents) : null;
  const contributionsNeeded = needed !== null && needed <= 1200 ? needed : null;
  let due = 0;
  while (due < 1200 && paymentDate(goal.firstContributionDate, due) <= goal.deadline) due += 1;
  if (due === 1200 && paymentDate(goal.firstContributionDate, due) <= goal.deadline) throw new Error('Projection exceeds 100 years.');
  const deadlineBalanceCents = goal.savedCents + due * monthlyCents;
  if (!Number.isSafeInteger(deadlineBalanceCents)) throw new Error('Projection exceeds supported precision.');
  const completionDate = contributionsNeeded && contributionsNeeded > 0 ? paymentDate(goal.firstContributionDate, contributionsNeeded - 1) : null;
  return { remainingCents, progressPercent: Math.round(Math.min(100, goal.savedCents / goal.targetCents * 100) * 100) / 100,
    monthlyCents, contributionsNeeded, completionDate, deadlineBalanceCents,
    onTrack: remainingCents === 0 || (completionDate !== null && completionDate <= goal.deadline),
    assumptions: ['Zero interest and no assumed investment returns.', 'Monthly contributions continue on the stated schedule.',
      'Planned savings require the customer to stop the cost and redirect the amount.', 'Saved progress changes only through recorded contributions.'],
  };
}

/** Three equal monthly charges are review evidence, never proof of an unused service. */
export function detectSubscriptions(purchases: Purchase[], asOf: string): SubscriptionCandidate[] {
  const now = Date.parse(asOf);
  if (!Number.isFinite(now)) throw new Error('Invalid observation date.');
  const unique = new Map<string, Purchase>();
  for (const purchase of purchases) {
    if (!safeId(purchase.id) || !safeId(purchase.merchantId) || !positiveInteger(purchase.amountCents) || purchase.currency !== 'EUR' ||
      !Number.isFinite(Date.parse(purchase.postedAt))) throw new Error('Invalid purchase data.');
    const old = unique.get(purchase.id);
    if (old && JSON.stringify(old) !== JSON.stringify(purchase)) throw new Error('Conflicting purchase IDs.');
    unique.set(purchase.id, purchase);
  }
  const merchants = new Map<string, Purchase[]>();
  for (const purchase of unique.values()) {
    const time = Date.parse(purchase.postedAt);
    if (purchase.category !== 'streaming' || purchase.channel !== 'online' || time > now || now - time > 100 * 86400000) continue;
    merchants.set(purchase.merchantId, [...(merchants.get(purchase.merchantId) ?? []), purchase]);
  }
  const result: SubscriptionCandidate[] = [];
  for (const [merchantId, entries] of merchants) {
    const recent = entries.sort((a, b) => Date.parse(a.postedAt) - Date.parse(b.postedAt)).slice(-3);
    if (recent.length !== 3 || now - Date.parse(recent[2].postedAt) > 40 * 86400000) continue;
    if (!recent.every(purchase => purchase.amountCents === recent[0].amountCents)) continue;
    const intervals = [1, 2].map(index => (Date.parse(recent[index].postedAt) - Date.parse(recent[index - 1].postedAt)) / 86400000);
    if (!intervals.every(days => days >= 25 && days <= 35)) continue;
    result.push({ merchantId, label: recent[2].merchantLabel, monthlyCents: recent[2].amountCents,
      evidenceIds: recent.map(item => item.id), reasonCode: 'THREE_MONTHLY_CHARGES' });
  }
  return result.sort((a, b) => a.merchantId.localeCompare(b.merchantId));
}

function initialSnapshot(seed: SavingSeed): SavingSnapshot {
  if (!Number.isFinite(Date.parse(seed.asOf))) throw new Error('Invalid observation date.');
  checkGoal(seed.goal, seed.asOf);
  const baseline = projectGoal(seed.goal);
  return { contractVersion: 'saving-1.0', revision: 1, asOf: seed.asOf, goal: structuredClone(seed.goal),
    subscriptions: detectSubscriptions(seed.purchases, seed.asOf), reviews: [], intentions: [], contributions: [],
    baseline, projected: structuredClone(baseline), proactiveEnabled: true, snoozedUntil: null, primary: null };
}
function evaluateSaving(state: SavingSnapshot, quiet: boolean): SavingSnapshot {
  state.baseline = projectGoal(state.goal);
  state.projected = projectGoal(state.goal, state.intentions.reduce((sum, item) => sum + item.monthlyCents, 0));
  state.primary = null;
  if (quiet || !state.proactiveEnabled || state.projected.remainingCents === 0 ||
    (state.snoozedUntil && Date.parse(state.snoozedUntil) > Date.parse(state.asOf))) return state;
  const candidate = state.subscriptions.find(subscription => state.reviews.some(review => review.merchantId === subscription.merchantId && review.decision === 'unused') &&
    !state.intentions.some(intention => intention.merchantId === subscription.merchantId));
  if (candidate) {
    state.primary = { id: `saving:${state.goal.id}:${candidate.merchantId}`, type: 'saving-intention', merchantId: candidate.merchantId,
      title: 'Put a potential saving towards your goal',
      message: `If you stop this charge and redirect ${formatEuro(candidate.monthlyCents)} each month, your projection can improve. No subscription is cancelled here.`,
      evidenceIds: candidate.evidenceIds };
  } else {
    const unreviewed = state.subscriptions.filter(subscription => !state.reviews.some(review => review.merchantId === subscription.merchantId));
    if (unreviewed.length) state.primary = { id: `saving:${state.goal.id}:review`, type: 'review-subscriptions',
      title: 'Review recurring subscriptions',
      message: `You have ${unreviewed.length} recurring streaming charges totalling ${formatEuro(unreviewed.reduce((sum, item) => sum + item.monthlyCents, 0))}/month. Is there one you no longer use?`,
      evidenceIds: unreviewed.flatMap(item => item.evidenceIds) };
  }
  return state;
}
function validSavingEvent(value: unknown): value is SavingEvent {
  if (!record(value)) return false;
  const shape = (...keys: string[]) => exactKeys(value, ['type', ...keys]);
  switch (value.type) {
    case 'REVIEW_SUBSCRIPTION': return shape('merchantId', 'decision') && safeId(value.merchantId) && (value.decision === 'unused' || value.decision === 'keep');
    case 'ADD_SAVING_INTENTION': case 'REMOVE_SAVING_INTENTION': return shape('merchantId') && safeId(value.merchantId);
    case 'UPDATE_GOAL': return shape('title', 'targetCents', 'deadline', 'monthlyContributionCents', 'firstContributionDate') &&
      typeof value.title === 'string' && value.title.trim().length > 0 && value.title.length <= 100 && positiveInteger(value.targetCents) &&
      isMoney(value.monthlyContributionCents) && validDate(value.deadline) && validDate(value.firstContributionDate);
    case 'RECORD_CONTRIBUTION': return shape('contributionId', 'amountCents') && safeId(value.contributionId) && positiveInteger(value.amountCents);
    case 'SET_PROACTIVE': return shape('enabled') && typeof value.enabled === 'boolean';
    case 'SNOOZE_ADVICE': case 'RESET_DEMO': return shape();
    default: return false;
  }
}
export function createSavingService(seed: SavingSeed = getSavingDemoSeed()): SavingService {
  const baselineSeed = structuredClone(seed);
  let quiet = false;
  let current = evaluateSaving(initialSnapshot(baselineSeed), quiet);
  const read = () => structuredClone(current);
  const error = (code: 'INVALID_EVENT' | 'REVISION_CONFLICT' | 'ACTION_NOT_AVAILABLE', message: string): SavingResult =>
    ({ ok: false, error: { code, message }, snapshot: read() });
  return {
    async getSnapshot() { return read(); },
    async dispatch(request) {
      if (!record(request) || !exactKeys(request, ['expectedRevision', 'event']) || !positiveInteger(request.expectedRevision)) return error('INVALID_EVENT', 'Supply a valid revision and event.');
      if (request.expectedRevision !== current.revision) return error('REVISION_CONFLICT', 'Your goal changed. Review the latest plan.');
      if (!validSavingEvent(request.event)) return error('INVALID_EVENT', 'Check the saving event fields.');
      if (current.revision >= Number.MAX_SAFE_INTEGER) return error('INVALID_EVENT', 'Start a new demo session.');
      const event = structuredClone(request.event);
      let next = structuredClone(current);
      let nextQuiet = quiet;
      switch (event.type) {
        case 'REVIEW_SUBSCRIPTION':
          if (!next.subscriptions.some(item => item.merchantId === event.merchantId)) return error('ACTION_NOT_AVAILABLE', 'No matching subscription evidence.');
          next.reviews = next.reviews.filter(item => item.merchantId !== event.merchantId).concat({ merchantId: event.merchantId, decision: event.decision });
          if (event.decision === 'keep') next.intentions = next.intentions.filter(item => item.merchantId !== event.merchantId);
          nextQuiet = event.decision === 'keep';
          break;
        case 'ADD_SAVING_INTENTION': {
          const candidate = next.subscriptions.find(item => item.merchantId === event.merchantId);
          if (!candidate || next.primary?.type !== 'saving-intention' || next.primary.merchantId !== event.merchantId ||
            !next.reviews.some(item => item.merchantId === event.merchantId && item.decision === 'unused') || next.intentions.some(item => item.merchantId === event.merchantId)) {
            return error('ACTION_NOT_AVAILABLE', 'Confirm an unused subscription and review the current saving suggestion first.');
          }
          next.intentions.push({ merchantId: candidate.merchantId, monthlyCents: candidate.monthlyCents, acceptedAt: next.asOf, status: 'planned' });
          nextQuiet = true;
          break;
        }
        case 'REMOVE_SAVING_INTENTION':
          if (!next.intentions.some(item => item.merchantId === event.merchantId)) return error('ACTION_NOT_AVAILABLE', 'No matching saving intention.');
          next.intentions = next.intentions.filter(item => item.merchantId !== event.merchantId); nextQuiet = true; break;
        case 'UPDATE_GOAL':
          next.goal = { ...next.goal, title: event.title.trim(), targetCents: event.targetCents, deadline: event.deadline,
            monthlyContributionCents: event.monthlyContributionCents, firstContributionDate: event.firstContributionDate };
          break;
        case 'RECORD_CONTRIBUTION':
          if (next.contributions.some(item => item.id === event.contributionId)) return error('INVALID_EVENT', 'This contribution was already recorded.');
          if (!Number.isSafeInteger(next.goal.savedCents + event.amountCents)) return error('INVALID_EVENT', 'Contribution exceeds supported precision.');
          next.contributions.push({ id: event.contributionId, amountCents: event.amountCents, recordedAt: next.asOf });
          next.goal.savedCents += event.amountCents;
          break;
        case 'SNOOZE_ADVICE': next.snoozedUntil = new Date(Date.parse(next.asOf) + 30 * 86400000).toISOString(); break;
        case 'SET_PROACTIVE': next.proactiveEnabled = event.enabled; break;
        case 'RESET_DEMO': next = initialSnapshot(baselineSeed); nextQuiet = false; break;
      }
      try { checkGoal(next.goal, next.asOf); evaluateSaving(next, nextQuiet); } catch {
        return error('INVALID_EVENT', 'Check goal dates, amounts and supported projection limits.');
      }
      next.revision = current.revision + 1; current = next; quiet = nextQuiet;
      return { ok: true, snapshot: read() };
    },
  };
}
