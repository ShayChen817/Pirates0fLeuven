'use client';

import type { Snapshot } from '@/lib/types';
import { useMoments } from '@/components/session/MomentsProvider';
import { formatCents, formatDate } from '@/components/format';
import { KateAvatar } from '@/components/ui/primitives';
import { PrimaryActionCard } from './PrimaryAction';
import { byRule } from './copy';

type Bubble = { from: 'kate' | 'customer'; text: string };

/** Guided history derived from the shared snapshot — the same state the home screen reads. */
function history(snapshot: Snapshot): Bubble[] {
  const out: Bubble[] = [];
  const { context } = snapshot;
  const intent = byRule(snapshot, 'clarify-intent');
  if (intent && intent.status !== 'pending') {
    out.push({ from: 'kate', text: `${intent.title} Any other large expenses coming up?` });
    const move = context.commitments.find(c => c.purpose === 'moving');
    if (move) out.push({ from: 'customer', text: `I'm moving. ${formatCents(move.amountCents)} still to pay by ${formatDate(move.dueDate)}.` });
    else if (context.intent === 'long-term') out.push({ from: 'customer', text: `No other plans. It's a long-term goal of ${context.horizonYears} years.` });
    out.push({ from: 'kate', text: intent.message });
  }
  const reserve = byRule(snapshot, 'moving-reserve');
  if (reserve?.status === 'completed') {
    out.push({ from: 'kate', text: `${reserve.title}.` });
    out.push({ from: 'customer', text: 'Acknowledge reserve plan.' });
    out.push({ from: 'kate', text: reserve.message });
  }
  const coverage = byRule(snapshot, 'coverage-check');
  if (coverage?.status === 'completed') {
    out.push({ from: 'kate', text: 'Check your existing cover.' });
    out.push({ from: 'customer', text: context.coverageSource === 'customer-reported-need' ? 'I need cover.' : "I'm already insured elsewhere." });
    out.push({ from: 'kate', text: coverage.message });
  }
  const sim = byRule(snapshot, 'explore-investment');
  if (sim?.status === 'completed') {
    out.push({ from: 'customer', text: 'Confirm simulation.' });
    out.push({ from: 'kate', text: sim.message });
  }
  return out;
}

export function MovingKate() {
  const { snapshot } = useMoments();
  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-kbc-muted">Kate · guided advice. Replies use the buttons; there is no free-text chat in this prototype.</p>
      {snapshot ? <BubbleList items={history(snapshot)} /> : null}
      <PrimaryActionCard />
    </div>
  );
}

export function BubbleList({ items }: { items: Bubble[] }) {
  return (
    <ol className="space-y-2" aria-label="Conversation history">
      {items.map((b, i) => (
        <li key={i} className={`flex gap-2 ${b.from === 'customer' ? 'justify-end' : ''}`}>
          {b.from === 'kate' ? <KateAvatar size="h-7 w-7" /> : null}
          <p className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${b.from === 'kate' ? 'rounded-tl-sm bg-kbc-kate text-kbc-navy' : 'rounded-tr-sm bg-kbc-navy text-white'}`}>
            <span className="sr-only">{b.from === 'kate' ? 'Kate: ' : 'You: '}</span>{b.text}
          </p>
        </li>
      ))}
    </ol>
  );
}
