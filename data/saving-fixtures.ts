import type { Purchase, SavingSeed } from '../lib/saving-types.ts';

// DEMO: fictional merchants and posted purchases, already reflected in account balances.
const purchases: Purchase[] = [
  { merchantId: 'stream-a', merchantLabel: 'Netflix', amountCents: 1300 },
  { merchantId: 'stream-b', merchantLabel: 'Amazon Prime', amountCents: 1500 },
  { merchantId: 'stream-c', merchantLabel: 'Disney+', amountCents: 1000 },
].flatMap(merchant => ['07', '08', '09'].map(month => ({
  ...merchant, id: `${merchant.merchantId}-2026-${month}`, category: 'streaming' as const,
  currency: 'EUR' as const, channel: 'online' as const, postedAt: `2026-${month}-15T12:00:00.000Z`,
})));
const japan: SavingSeed = {
  asOf: '2026-10-01T12:00:00.000Z',
  goal: { id: 'japan', title: 'Japan trip', targetCents: 200000, savedCents: 65000,
    deadline: '2027-08-01', monthlyContributionCents: 12500, firstContributionDate: '2026-11-01' },
  purchases,
};
export function getSavingDemoSeed(): SavingSeed { return structuredClone(japan); }
// Independent expected values for UI previews and backend assertions, not engine output.
export const savingGolden = {
  initial: { savedCents: 65000, progressPercent: 32.5, completionDate: '2027-09-01', contributionsNeeded: 11, deadlineBalanceCents: 190000 },
  planned: { savedCents: 65000, progressPercent: 32.5, monthlyCents: 13800, completionDate: '2027-08-01', contributionsNeeded: 10, deadlineBalanceCents: 203000 },
} as const;

/**
 * DEMO-ONLY presentation extras for the Saving home screen. These are NOT part of the
 * `saving-1.0` contract or the decision engine — they are synthetic values the UI reads
 * directly to show a spending breakdown, an emergency-fund status and an illustrative
 * (gated) investing tip. Nothing here influences the deterministic saving service.
 */
export const savingDemoExtras = {
  // Synthetic monthly spending snapshot for the "where your money goes" donut.
  // Subscriptions (€38) ties to the three streaming charges the engine detects.
  monthlySpend: [
    { key: 'groceries', label: 'Groceries', cents: 32000 },
    { key: 'coffee', label: 'Coffee & eating out', cents: 9200 },
    { key: 'shopping', label: 'Shopping', cents: 7000 },
    { key: 'other', label: 'Other', cents: 6000 },
    { key: 'transport', label: 'Transport', cents: 5500 },
    { key: 'subscriptions', label: 'Subscriptions', cents: 3800, highlight: true },
  ],
  // Emergency fund gate: investing content stays hidden until the buffer clears the threshold.
  emergencyFundCents: 350000, // €3,500 — deliberately below threshold so "build it first" shows by default
  investUnlockThresholdCents: 500000, // €5,000
  // The amount a customer could free by dropping one subscription, used by the invest tip.
  investDemoMonthlyCents: 1300, // €13/month
  investHorizonYears: 10,
  // Illustrative long-run *average* annual returns for education only.
  // NOT KBC products, forecasts or promises. Past performance does not predict the future.
  investIndexes: [
    { id: 'msci-world', label: 'MSCI World (global equity)', ratePct: 7 },
    { id: 'sp500', label: 'S&P 500 (US equity)', ratePct: 9 },
    { id: 'balanced', label: 'Balanced fund (bonds + equity)', ratePct: 4 },
  ],
} as const;
