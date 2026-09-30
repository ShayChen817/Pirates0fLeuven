/** Separate contract: does not widen the Moving v1 discriminated unions. */
export interface SavingGoal {
  id: string; title: string; targetCents: number; savedCents: number;
  deadline: string; monthlyContributionCents: number; firstContributionDate: string;
}
export interface Purchase {
  id: string; merchantId: string; merchantLabel: string;
  category: 'streaming' | 'furniture' | 'moving-service' | 'other';
  amountCents: number; currency: 'EUR'; postedAt: string;
  channel: 'online' | 'physical';
}
export interface SubscriptionCandidate {
  merchantId: string; label: string; monthlyCents: number; evidenceIds: string[];
  reasonCode: 'THREE_MONTHLY_CHARGES';
}
export interface SavingIntention {
  merchantId: string; monthlyCents: number; acceptedAt: string;
  status: 'planned'; // not cancellation, transferred funds or realised savings
}
export interface GoalProjection {
  remainingCents: number; progressPercent: number; monthlyCents: number;
  contributionsNeeded: number | null; completionDate: string | null;
  deadlineBalanceCents: number; onTrack: boolean;
  assumptions: string[];
}
export interface SavingSeed {
  asOf: string; goal: SavingGoal; purchases: Purchase[];
}
export interface SavingSnapshot {
  contractVersion: 'saving-1.0'; revision: number; asOf: string;
  goal: SavingGoal; subscriptions: SubscriptionCandidate[];
  reviews: { merchantId: string; decision: 'unused' | 'keep' }[];
  intentions: SavingIntention[];
  contributions: { id: string; amountCents: number; recordedAt: string }[];
  baseline: GoalProjection; projected: GoalProjection;
  proactiveEnabled: boolean; snoozedUntil: string | null;
  primary: null | { id: string; type: 'review-subscriptions' | 'saving-intention';
    title: string; message: string; evidenceIds: string[]; merchantId?: string };
}
export type SavingEvent =
  | { type: 'REVIEW_SUBSCRIPTION'; merchantId: string; decision: 'unused' | 'keep' }
  | { type: 'ADD_SAVING_INTENTION'; merchantId: string }
  | { type: 'REMOVE_SAVING_INTENTION'; merchantId: string }
  | { type: 'UPDATE_GOAL'; title: string; targetCents: number; deadline: string; monthlyContributionCents: number; firstContributionDate: string }
  | { type: 'RECORD_CONTRIBUTION'; contributionId: string; amountCents: number }
  | { type: 'SNOOZE_ADVICE' }
  | { type: 'SET_PROACTIVE'; enabled: boolean }
  | { type: 'RESET_DEMO' };
export type SavingResult = { ok: true; snapshot: SavingSnapshot } |
  { ok: false; error: { code: 'REVISION_CONFLICT' | 'INVALID_EVENT' | 'ACTION_NOT_AVAILABLE'; message: string }; snapshot: SavingSnapshot };
export interface SavingService {
  getSnapshot(): Promise<SavingSnapshot>;
  dispatch(request: { expectedRevision: number; event: SavingEvent }): Promise<SavingResult>;
}
