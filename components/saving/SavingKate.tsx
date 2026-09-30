'use client';

import type { SavingSnapshot } from '@/lib/saving-types';
import { useSaving } from '@/components/session/SavingProvider';
import { formatCents } from '@/components/format';
import { BubbleList } from '@/components/moving/MovingKate';
import { SavingKateCard } from './SavingCard';
import { subscriptionById } from './view';

/** Guided history derived from the saving snapshot — the same state the home screen reads. */
function history(s: SavingSnapshot) {
  const out: { from: 'kate' | 'customer'; text: string }[] = [];
  if (!s.reviews.length && !s.snoozedUntil) return out;
  const total = s.subscriptions.reduce((sum, x) => sum + x.monthlyCents, 0);
  out.push({ from: 'kate', text: `You have ${s.subscriptions.length} recurring streaming charges totalling ${formatCents(total)}/month. Is there one you no longer use?` });
  for (const r of s.reviews) {
    const label = subscriptionById(s, r.merchantId)?.label ?? r.merchantId;
    out.push({ from: 'customer', text: r.decision === 'unused' ? `I no longer use ${label}.` : `Keep ${label}.` });
  }
  for (const i of s.intentions) {
    out.push({ from: 'customer', text: 'Add to my plan.' });
    out.push({ from: 'kate', text: `Planned: ${formatCents(i.monthlyCents)}/month towards ${s.goal.title}. Nothing is cancelled and your saved amount stays the same.` });
  }
  if (s.snoozedUntil) out.push({ from: 'customer', text: 'Not now.' });
  return out;
}

export function SavingKate() {
  const { snapshot } = useSaving();
  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-kbc-muted">Kate · guided advice. Replies use the buttons; there is no free-text chat in this prototype.</p>
      {snapshot ? <BubbleList items={history(snapshot)} /> : null}
      <SavingKateCard />
    </div>
  );
}
