/** Shared contract v1. All money is EUR integer cents; dates are ISO strings. */
export const CONTRACT_VERSION = '1.0' as const;
export type RuleId = 'clarify-intent' | 'moving-reserve' | 'coverage-check' | 'explore-investment';
export type Coverage = 'unknown' | 'confirmed-covered' | 'confirmed-need';
export type ReasonCode =
  | 'INTENT_UNKNOWN' | 'INTENT_CONFIRMED' | 'NO_MOVE_CONFIRMED'
  | 'NEAR_TERM_COMMITMENT' | 'RESERVE_REVIEW_REQUIRED' | 'RESERVE_REVIEW_PENDING'
  | 'ACTION_COMPLETED' | 'ACTION_DISMISSED' | 'COVERAGE_UNKNOWN'
  | 'COVERAGE_CONFIRMED' | 'COVERAGE_HELP_REQUESTED' | 'LONG_TERM_ELIGIBLE'
  | 'INSUFFICIENT_AVAILABLE_CASH' | 'PROFILE_INCOMPLETE' | 'HORIZON_TOO_SHORT'
  | 'STALE_OR_MISSING_DATA' | 'CONFLICTING_DATA' | 'PROACTIVE_PAUSED' | 'LOWER_PRIORITY';

export interface Signal {
  id: string;
  key: string;
  value: string | number | boolean;
  source: string;
  kind: 'observed' | 'inferred' | 'customer-confirmed';
  observedAt: string;
  validUntil: string;
}
export interface Commitment {
  id: string;
  amountCents: number;
  dueDate: string;
  purpose: 'moving' | 'other';
}
export interface MonthlySummary {
  month: string; // YYYY-MM; descriptive history only
  incomeCents: number;
  essentialSpendingCents: number;
}
export interface CustomerContext {
  customerId: string;
  displayName: string;
  version: number;
  asOf: string;
  currency: 'EUR';
  accessibleCashCents: number;
  reserveCents: number;
  expensesCents: number;
  commitments: Commitment[]; // additional to expenses; unique IDs
  commitmentsConfirmed: boolean;
  monthlyHistory: MonthlySummary[];
  signals: Signal[];
  intent: 'unknown' | 'near-term' | 'long-term';
  coverage: Coverage;
  coverageSource: 'unknown' | 'customer-reported-external' | 'customer-reported-need';
  profileComplete: boolean;
  horizonYears: number | null;
  riskProfile: 'defensive' | 'neutral' | 'dynamic' | null;
  proactiveEnabled: boolean;
}
export type ActionStatus = 'pending' | 'completed' | 'dismissed' | 'invalidated';
export interface Action {
  id: string; // `${customerId}:${ruleId}`, stable across re-evaluation
  customerId: string;
  ruleId: RuleId;
  contextVersion: number;
  domain: 'planning' | 'investing' | 'insurance';
  status: ActionStatus;
  title: string;
  message: string;
  cta: string;
  reasonCodes: ReasonCode[];
  evidenceIds: string[];
  amountCents?: number;
}
export interface Decision {
  primaryActionId: string | null; // references exactly one pending action, never a copy
  trace: {
    ruleId: RuleId;
    outcome: 'selected' | 'deferred' | 'suppressed';
    reasonCode: ReasonCode;
    evidenceIds: string[];
  }[];
}
export interface Snapshot {
  contractVersion: typeof CONTRACT_VERSION;
  revision: number; // increment for every accepted mutation, including reset
  context: CustomerContext;
  availableCashCents: number;
  actions: Action[];
  decision: Decision;
}

export type CustomerEvent =
  | { type: 'CONFIRM_MOVING'; commitment: Commitment & { purpose: 'moving' } }
  | { type: 'CONFIRM_LONG_TERM'; horizonYears: number; noAdditionalCommitments: true }
  | { type: 'ACKNOWLEDGE_RESERVE'; actionId: string }
  | { type: 'REPORT_COVERAGE'; coverage: Exclude<Coverage, 'unknown'> }
  | { type: 'DISMISS_ACTION'; actionId: string }
  | { type: 'CONFIRM_SIMULATION'; actionId: string; amountCents: number }
  | { type: 'CLEAR_CONTEXT'; field: 'coverage' | 'intent' | 'moving' }
  | { type: 'SET_PROACTIVE'; enabled: boolean }
  | { type: 'RESET_DEMO' };
export interface DispatchRequest {
  expectedRevision: number;
  event: CustomerEvent;
}
export type ErrorCode = 'REVISION_CONFLICT' | 'INVALID_EVENT' | 'ACTION_NOT_AVAILABLE' | 'NOT_ELIGIBLE';
export type DispatchResult =
  | { ok: true; snapshot: Snapshot }
  | { ok: false; error: { code: ErrorCode; message: string }; snapshot: Snapshot };

/** UI depends on this boundary. Implement one instance per demo session. No HTTP required. */
export interface MomentsService {
  getSnapshot(): Promise<Snapshot>;
  dispatch(request: DispatchRequest): Promise<DispatchResult>;
}
export type FixtureId = 'initial' | 'moving' | 'coverage-check' | 'covered' | 'investing' | 'invested';
export interface DemoFixture {
  id: FixtureId;
  description: string;
  snapshot: Snapshot;
}
export interface DemoTransition {
  from: FixtureId;
  request: DispatchRequest;
  to: FixtureId;
}
