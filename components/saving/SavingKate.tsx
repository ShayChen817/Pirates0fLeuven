'use client';

// DEMO: Saving concept preview — not connected to the engine.
import { useSaving } from '@/components/session/SavingProvider';
import { BubbleList } from '@/components/moving/MovingKate';
import { SavingKateCard } from './SavingCard';

export function SavingKate() {
  const { state } = useSaving();
  // The last Kate line is the live card below; earlier lines are history.
  const history = state.status === 'suggested' ? [] : state.history.slice(0, -1);
  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-kbc-muted">Kate · guided advice. Replies use the buttons; there is no free-text chat in this prototype.</p>
      <BubbleList items={history} />
      <SavingKateCard />
    </div>
  );
}
