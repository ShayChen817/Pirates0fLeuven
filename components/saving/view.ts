import type { SavingSnapshot, SubscriptionCandidate } from '@/lib/saving-types';
import { getSavingDemoSeed } from '@/data/saving-fixtures';

export type SavingView = 'review' | 'intention' | 'planned' | 'kept' | 'snoozed' | 'paused' | 'quiet';

/** Which Kate card to show. Derived only from the returned saving snapshot. */
export function savingView(s: SavingSnapshot): SavingView {
  if (s.intentions.length) return 'planned';
  if (s.primary?.type === 'saving-intention') return 'intention';
  if (s.primary?.type === 'review-subscriptions') return 'review';
  if (!s.proactiveEnabled) return 'paused';
  if (s.snoozedUntil && Date.parse(s.snoozedUntil) > Date.parse(s.asOf)) return 'snoozed';
  if (s.reviews.some(r => r.decision === 'keep')) return 'kept';
  return 'quiet';
}

export const subscriptionById = (s: SavingSnapshot, merchantId?: string | null): SubscriptionCandidate | undefined =>
  s.subscriptions.find(sub => sub.merchantId === merchantId);

// Display-only lookup of the synthetic purchase dates behind each evidence ID.
const postedAt = new Map(getSavingDemoSeed().purchases.map(p => [p.id, p.postedAt]));
export const evidenceDates = (ids: string[]) => ids.map(id => postedAt.get(id)).filter((d): d is string => !!d);
