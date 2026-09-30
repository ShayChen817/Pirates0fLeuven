'use client';

import type { Snapshot } from '@/lib/types';
import { useMoments } from '@/components/session/MomentsProvider';
import { formatCents, formatDate } from '@/components/format';
import { KateScreen, type Bubble } from '@/components/ui/KateScreen';
import { PrimaryActionCard } from './PrimaryAction';
import { byRule } from './copy';

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
    <KateScreen history={snapshot ? history(snapshot) : []}>
      <PrimaryActionCard />
    </KateScreen>
  );
}
