import { getDemoSnapshot } from '../data/demo-fixtures.ts';
import { evaluateSnapshot } from './engine.ts';
import { formatEuro, isFutureDate, uniqueCommitments } from './context.ts';
import { exactKeys, positiveInteger, record, safeId } from './validation.ts';
import type { Action, CustomerContext, CustomerEvent, DispatchResult, ErrorCode, MomentsService, RuleId, Snapshot } from './types.ts';

function validEvent(value: unknown, context: CustomerContext): value is CustomerEvent {
  if (!record(value) || typeof value.type !== 'string') return false;
  const shape = (...keys: string[]) => exactKeys(value, ['type', ...keys]);
  switch (value.type) {
    case 'CONFIRM_MOVING': return shape('commitment') && record(value.commitment) &&
      exactKeys(value.commitment, ['id', 'amountCents', 'dueDate', 'purpose']) && safeId(value.commitment.id) &&
      positiveInteger(value.commitment.amountCents) && isFutureDate(value.commitment.dueDate, context.asOf) && value.commitment.purpose === 'moving';
    case 'CONFIRM_LONG_TERM': return shape('horizonYears', 'noAdditionalCommitments') &&
      positiveInteger(value.horizonYears) && value.horizonYears <= 100 && value.noAdditionalCommitments === true;
    case 'ACKNOWLEDGE_RESERVE': case 'DISMISS_ACTION': return shape('actionId') && safeId(value.actionId);
    case 'REPORT_COVERAGE': return shape('coverage') && ['confirmed-covered', 'confirmed-need'].includes(String(value.coverage));
    case 'CONFIRM_SIMULATION': return shape('actionId', 'amountCents') && safeId(value.actionId) && positiveInteger(value.amountCents);
    case 'CLEAR_CONTEXT': return shape('field') && ['coverage', 'intent', 'moving'].includes(String(value.field));
    case 'SET_PROACTIVE': return shape('enabled') && typeof value.enabled === 'boolean';
    case 'RESET_DEMO': return shape();
    default: return false;
  }
}

/** One isolated synthetic session. No global state, network, credentials or real transactions. */
export function createMomentsService(initial: Snapshot = getDemoSnapshot()): MomentsService {
  // Initial snapshots are developer-supplied fixtures, never a dispatch payload.
  let current = evaluateSnapshot(structuredClone(initial));
  const read = () => structuredClone(current);
  const error = (code: ErrorCode, message: string): DispatchResult => ({ ok: false, error: { code, message }, snapshot: read() });
  return {
    async getSnapshot() { return read(); },
    async dispatch(request) {
      // There are no awaits before committing state: competing calls cannot both accept one revision.
      if (!record(request) || !exactKeys(request, ['expectedRevision', 'event']) || !positiveInteger(request.expectedRevision)) {
        return error('INVALID_EVENT', 'Supply an expected revision and a supported event.');
      }
      if (request.expectedRevision !== current.revision) return error('REVISION_CONFLICT', 'Your plans changed. Review the current state before trying again.');
      if (!validEvent(request.event, current.context)) return error('INVALID_EVENT', 'Check the event fields, amount and date.');
      if (current.revision >= Number.MAX_SAFE_INTEGER || current.context.version >= Number.MAX_SAFE_INTEGER) return error('INVALID_EVENT', 'Start a new demo session.');
      const event = structuredClone(request.event);
      const next = structuredClone(current);
      const ctx = next.context;
      let changedContext = false;
      const invalidate = (...rules: RuleId[]) => {
        next.actions = next.actions.map(action => rules.includes(action.ruleId) ? { ...action, status: 'invalidated' } : action);
      };
      const forget = (...ids: string[]) => { ctx.signals = ctx.signals.filter(signal => !ids.includes(signal.id)); };
      const fact = (id: string, value: string | number | boolean) => {
        forget(id);
        ctx.signals.push({ id, key: id, value, source: 'Synthetic customer response', kind: 'customer-confirmed',
          observedAt: ctx.asOf, validUntil: new Date(Date.parse(ctx.asOf) + 31 * 86400000).toISOString() });
      };
      const resolve = (ruleId: RuleId, message: string, reason: Action['reasonCodes'][number], evidenceIds: string[], amountCents?: number) => {
        const id = `${ctx.customerId}:${ruleId}`;
        const previous = next.actions.find(action => action.id === id);
        const action: Action = { id, customerId: ctx.customerId, ruleId, contextVersion: ctx.version + (changedContext ? 1 : 0),
          domain: ruleId === 'coverage-check' ? 'insurance' : ruleId === 'explore-investment' ? 'investing' : 'planning',
          status: 'completed', title: previous?.title ?? 'Answer recorded', cta: previous?.cta ?? 'Review',
          message, reasonCodes: [reason], evidenceIds, ...(amountCents !== undefined ? { amountCents } : {}) };
        next.actions = next.actions.filter(item => item.id !== id).concat(action);
      };
      const target = 'actionId' in event ? current.actions.find(action => action.id === event.actionId) : undefined;
      if ('actionId' in event && (!target || target.id !== current.decision.primaryActionId || target.status !== 'pending')) {
        return error('ACTION_NOT_AVAILABLE', 'This action is no longer available. Review the current suggestion.');
      }
      switch (event.type) {
        case 'CONFIRM_MOVING': {
          const existing = ctx.commitments.find(item => item.id === event.commitment.id);
          if (existing && existing.purpose !== 'moving') return error('INVALID_EVENT', 'This commitment ID belongs to another purpose.');
          const material = !existing || existing.amountCents !== event.commitment.amountCents || existing.dueDate !== event.commitment.dueDate || ctx.intent !== 'near-term';
          ctx.commitments = uniqueCommitments(ctx.commitments.filter(item => item.id !== event.commitment.id).concat(event.commitment));
          const total = ctx.commitments.filter(item => item.purpose === 'moving').reduce((sum, item) => sum + item.amountCents, 0);
          if (!Number.isSafeInteger(total) || !Number.isSafeInteger(ctx.reserveCents + ctx.expensesCents + ctx.commitments.reduce((sum, item) => sum + item.amountCents, 0))) {
            return error('INVALID_EVENT', 'The total amount exceeds supported precision.');
          }
          ctx.intent = 'near-term'; ctx.horizonYears = null; ctx.commitmentsConfirmed = true; changedContext = true;
          forget('horizon', 'commitments-confirmed'); fact('moving-plan', total); fact('intent', 'near-term');
          if (material) invalidate('moving-reserve', 'explore-investment');
          resolve('clarify-intent', 'Your moving plan has been recorded.', 'INTENT_CONFIRMED', ['intent']);
          break;
        }
        case 'CONFIRM_LONG_TERM': {
          if (ctx.commitments.length) return error('INVALID_EVENT', 'Review existing commitments before confirming no additional plans.');
          const material = ctx.intent !== 'long-term' || ctx.horizonYears !== event.horizonYears || !ctx.commitmentsConfirmed;
          ctx.intent = 'long-term'; ctx.horizonYears = event.horizonYears; ctx.commitmentsConfirmed = true; changedContext = true;
          fact('intent', 'long-term'); fact('horizon', event.horizonYears); fact('commitments-confirmed', true);
          if (material) invalidate('explore-investment');
          resolve('clarify-intent', 'Your long-term plan has been recorded.', 'INTENT_CONFIRMED', ['intent']);
          break;
        }
        case 'ACKNOWLEDGE_RESERVE':
          if (target?.ruleId !== 'moving-reserve') return error('ACTION_NOT_AVAILABLE', 'Select the current reserve review.');
          resolve('moving-reserve', 'Reserve plan acknowledged. The commitment remains; no money moved.', 'ACTION_COMPLETED', target.evidenceIds, target.amountCents);
          break;
        case 'REPORT_COVERAGE':
          ctx.coverage = event.coverage;
          ctx.coverageSource = event.coverage === 'confirmed-covered' ? 'customer-reported-external' : 'customer-reported-need';
          changedContext = true;
          fact('coverage', event.coverage === 'confirmed-covered' ? 'Already insured elsewhere' : 'Customer requests a coverage review');
          resolve('coverage-check', event.coverage === 'confirmed-covered'
            ? 'You reported existing external coverage. It has not been independently verified.'
            : 'Your request for a coverage review is recorded. No adviser or insurer has been contacted.',
          event.coverage === 'confirmed-covered' ? 'COVERAGE_CONFIRMED' : 'COVERAGE_HELP_REQUESTED', ['coverage']);
          break;
        case 'DISMISS_ACTION':
          next.actions = next.actions.map(action => action.id === event.actionId ? { ...action, status: 'dismissed', reasonCodes: ['ACTION_DISMISSED'] } : action);
          break;
        case 'CONFIRM_SIMULATION': {
          if (target?.ruleId !== 'explore-investment') return error('ACTION_NOT_AVAILABLE', 'Select the current investment simulation.');
          const checked = evaluateSnapshot(current);
          if (checked.decision.primaryActionId !== event.actionId || event.amountCents > checked.availableCashCents) {
            return error('NOT_ELIGIBLE', 'The simulation does not fit the current available amount.');
          }
          resolve('explore-investment', `Your ${formatEuro(event.amountCents)} simulation is complete. No money has moved.`, 'ACTION_COMPLETED', target.evidenceIds, event.amountCents);
          break;
        }
        case 'CLEAR_CONTEXT':
          changedContext = true;
          if (event.field === 'coverage') {
            ctx.coverage = 'unknown'; ctx.coverageSource = 'unknown'; forget('coverage'); invalidate('coverage-check');
          } else {
            if (event.field === 'moving') {
              ctx.commitments = ctx.commitments.filter(item => item.purpose !== 'moving');
              forget('moving-plan'); invalidate('moving-reserve', 'coverage-check');
            }
            ctx.intent = 'unknown'; ctx.horizonYears = null; ctx.commitmentsConfirmed = false;
            forget('intent', 'horizon', 'commitments-confirmed'); invalidate('clarify-intent', 'explore-investment');
          }
          break;
        case 'SET_PROACTIVE': ctx.proactiveEnabled = event.enabled; changedContext = true; break;
        case 'RESET_DEMO': {
          const reset = getDemoSnapshot();
          reset.revision = current.revision + 1; reset.context.version = current.context.version + 1;
          current = evaluateSnapshot(reset);
          return { ok: true, snapshot: read() };
        }
      }
      if (changedContext) ctx.version += 1;
      next.revision += 1;
      // Cleared facts must not remain referenced by historical action payloads.
      next.actions.forEach(action => { action.evidenceIds = action.evidenceIds.filter(id => ctx.signals.some(signal => signal.id === id)); });
      current = evaluateSnapshot(next);
      return { ok: true, snapshot: read() };
    },
  };
}
