/** Independent educational context; never an allocation from the Saving or Moving ledger. */
export interface SpendingCategory { id: string; label: string; cents: number; highlight?: boolean }
export interface SavingInsightsSeed {
  period: string;
  spending: SpendingCategory[];
  emergencyFundCents: number;
  bufferTargetCents: number;
}
export interface InvestmentIllustration {
  monthlyCents: number;
  years: number;
  contributedCents: number;
  scenarios: { label: string; annualRatePercent: number; valueCents: number }[];
}
export interface SavingInsightsSnapshot extends SavingInsightsSeed {
  contractVersion: 'saving-insights-1.0';
  revision: number;
  spendingTotalCents: number;
  bufferGapCents: number;
  bufferFunded: boolean;
  longTermRequested: boolean;
  illustration: InvestmentIllustration | null;
}
export type SavingInsightsEvent =
  | { type: 'SET_DEMO_FUNDED'; funded: boolean }
  | { type: 'REQUEST_LONG_TERM_EXAMPLE' }
  | { type: 'RESET_DEMO' };
export type SavingInsightsResult = { ok: true; snapshot: SavingInsightsSnapshot } |
  { ok: false; error: { code: 'INVALID_EVENT' | 'REVISION_CONFLICT' | 'ACTION_NOT_AVAILABLE'; message: string }; snapshot: SavingInsightsSnapshot };
export interface SavingInsightsService {
  getSnapshot(): Promise<SavingInsightsSnapshot>;
  dispatch(request: { expectedRevision: number; event: SavingInsightsEvent }): Promise<SavingInsightsResult>;
}
