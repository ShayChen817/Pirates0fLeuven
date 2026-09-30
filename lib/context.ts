import type { Commitment, CustomerContext, ReasonCode } from './types.ts';

export const isMoney = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export function uniqueCommitments(items: Commitment[]): Commitment[] {
  const unique = new Map<string, Commitment>();
  for (const item of items) {
    const previous = unique.get(item.id);
    if (previous && (previous.amountCents !== item.amountCents || previous.dueDate !== item.dueDate || previous.purpose !== item.purpose)) {
      throw new Error('Conflicting commitment IDs.');
    }
    unique.set(item.id, item);
  }
  return [...unique.values()];
}

export function availableCash(context: CustomerContext): number {
  const amounts = [context.accessibleCashCents, context.reserveCents, context.expensesCents,
    ...uniqueCommitments(context.commitments).map(item => item.amountCents)];
  if (!amounts.every(isMoney)) throw new Error('Amounts must be nonnegative safe integer cents.');
  const deductions = amounts.slice(1).reduce((total, amount) => total + amount, 0);
  if (!Number.isSafeInteger(deductions)) throw new Error('Amount exceeds supported precision.');
  return Math.max(0, amounts[0] - deductions);
}

export function isFutureDate(value: unknown, asOf: string): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && date.getTime() > Date.parse(asOf);
}

export function contextIssue(context: CustomerContext): ReasonCode | null {
  if (!Number.isFinite(Date.parse(context.asOf))) return 'STALE_OR_MISSING_DATA';
  try { availableCash(context); } catch { return 'CONFLICTING_DATA'; }
  if (context.commitments.some(item => !item.id || !isFutureDate(item.dueDate, context.asOf))) return 'STALE_OR_MISSING_DATA';
  const required = ['cash', 'reserve', 'expenses'];
  if (context.intent !== 'unknown') required.push('intent');
  if (context.intent === 'long-term') required.push('horizon', 'commitments-confirmed');
  if (context.commitments.some(item => item.purpose === 'moving')) required.push('moving-plan');
  if (context.coverage !== 'unknown') required.push('coverage');
  for (const id of required) {
    const matches = context.signals.filter(signal => signal.id === id);
    if (matches.length > 1) return 'CONFLICTING_DATA';
    const signal = matches[0];
    if (!signal || !(Date.parse(signal.observedAt) <= Date.parse(context.asOf)) || !(Date.parse(context.asOf) < Date.parse(signal.validUntil))) {
      return 'STALE_OR_MISSING_DATA';
    }
  }
  const values: Record<string, unknown> = {
    cash: context.accessibleCashCents, reserve: context.reserveCents, expenses: context.expensesCents,
  };
  if (context.intent !== 'unknown') values.intent = context.intent;
  if (context.intent === 'long-term') {
    values.horizon = context.horizonYears;
    values['commitments-confirmed'] = context.commitmentsConfirmed;
  }
  const moving = uniqueCommitments(context.commitments).filter(item => item.purpose === 'moving');
  if (moving.length) values['moving-plan'] = moving.reduce((sum, item) => sum + item.amountCents, 0);
  if (Object.entries(values).some(([id, value]) => context.signals.find(item => item.id === id)?.value !== value)) return 'CONFLICTING_DATA';
  if (context.intent === 'long-term' && moving.length) return 'CONFLICTING_DATA';
  return null;
}

export function profileIsCurrent(context: CustomerContext): boolean {
  const signals = context.signals.filter(item => item.id === 'profile');
  const signal = signals[0];
  return context.profileComplete && ['defensive', 'neutral', 'dynamic'].includes(context.riskProfile ?? '') && signals.length === 1 &&
    Date.parse(signal.observedAt) <= Date.parse(context.asOf) && Date.parse(context.asOf) < Date.parse(signal.validUntil);
}

export const formatEuro = (cents: number): string =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

// DEMO: illustrative rounding policy, never a suitability or safety guarantee.
export const suggestedAmount = (available: number): number => Math.min(available, Math.round(available / 2 / 50000) * 50000);
