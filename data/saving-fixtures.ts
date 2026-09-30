import type { Purchase, SavingSeed } from '../lib/saving-types.ts';

// DEMO: fictional merchants and posted purchases, already reflected in account balances.
const purchases: Purchase[] = [
  { merchantId: 'stream-a', merchantLabel: 'Stream A', amountCents: 1300 },
  { merchantId: 'stream-b', merchantLabel: 'Stream B', amountCents: 1500 },
  { merchantId: 'stream-c', merchantLabel: 'Stream C', amountCents: 1000 },
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
