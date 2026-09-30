'use client';
import { useSavingInsights } from '@/components/session/SavingInsightsProvider';
import { Card } from '@/components/ui/primitives';
import { Donut } from '@/components/ui/Donut';
import { formatCents, formatMonth } from '@/components/format';
export function SpendingOverview() {
  const { snapshot } = useSavingInsights();
  if (!snapshot) return null;
  return <Card aria-label="Where your money goes">
    <h3 className="text-sm font-semibold">Where your money goes</h3>
    <p className="mt-1 text-xs text-ink-3">{formatMonth(`${snapshot.period}-01`)} · selected categories</p>
    <div className="mt-5"><Donut data={snapshot.spending.map(s => ({ label: s.label, value: s.cents, highlight: s.highlight }))} centerTop="Recorded" centerMain={formatCents(snapshot.spendingTotalCents)} /></div>
    <p className="mt-4 text-[11px] leading-relaxed text-ink-3">Synthetic spending, not a complete budget. Subscription totals come from the same example charges Kate reviews. Plans do not change historical spending.</p>
  </Card>;
}
