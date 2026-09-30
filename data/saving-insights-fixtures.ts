import type { SavingInsightsSeed } from '../lib/saving-insights-types.ts';
import { getSavingDemoSeed } from './saving-fixtures.ts';

export function getSavingInsightsSeed(): SavingInsightsSeed {
  const period = '2026-09';
  // DEMO: selected spending categories, not a complete budget or an affordability calculation.
  // Derive streaming from the same posted purchases used by the Saving service.
  const subscriptions = getSavingDemoSeed().purchases.filter(p => p.category === 'streaming' && p.postedAt.startsWith(period));
  return { period, spending: [
    { id: 'groceries', label: 'Groceries', cents: 32000 },
    { id: 'coffee', label: 'Coffee & eating out', cents: 9200 },
    { id: 'shopping', label: 'Shopping', cents: 7000 },
    { id: 'other', label: 'Other', cents: 6000 },
    { id: 'transport', label: 'Transport', cents: 5500 },
    { id: 'subscriptions', label: 'Subscriptions', cents: subscriptions.reduce((sum, p) => sum + p.amountCents, 0), highlight: true },
  ], emergencyFundCents: 350000, bufferTargetCents: 500000 };
}
