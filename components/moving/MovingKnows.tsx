'use client';
import { useMoments } from '@/components/session/MomentsProvider';
import { formatCents, formatDate } from '@/components/format';
import { Button, Notice } from '@/components/ui/primitives';
import { describeSignal, kindLabel } from './copy';

export function MovingKnows() {
  const { snapshot, send, pending, error, transportError, clearError } = useMoments();
  if (!snapshot) return <p role="status">Loading…</p>;
  const { context } = snapshot;
  const move = context.commitments.find(c => c.purpose === 'moving');
  const plans: { field: 'moving' | 'intent' | 'coverage'; label: string; value: string }[] = [];
  if (move) plans.push({ field: 'moving', label: 'Moving plan', value: `${formatCents(move.amountCents)} by ${formatDate(move.dueDate)}` });
  if (context.intent !== 'unknown') plans.push({ field: 'intent', label: 'Your intention', value: context.intent === 'near-term' ? 'A near-term plan' : `Long-term goal · ${context.horizonYears} years` });
  if (context.coverage !== 'unknown') plans.push({ field: 'coverage', label: 'Home cover', value: context.coverage === 'confirmed-covered' ? 'Insured elsewhere · customer-reported' : 'You need cover' });
  return <div className="space-y-6">
    <p className="editor-help">Review your answers and where the information came from.</p>
    {error || transportError ? <Notice tone="error" title="Not changed" onClose={clearError}>{error?.message ?? transportError}</Notice> : null}
    <section><h3 className="section-label">Your answers</h3>
      {plans.length ? <ul className="divide-y divide-line">{plans.map(p => <li key={p.field} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="text-sm font-semibold">{p.label}</p><p className="mt-1 text-xs leading-relaxed text-ink-3">{p.value}</p></div><Button variant="text" disabled={!!pending} onClick={() => void send({ type: 'CLEAR_CONTEXT', field: p.field })}>Clear</Button></li>)}</ul> : <p className="mt-2 text-sm text-ink-3">No plans confirmed yet.</p>}
    </section>
    <section><h3 className="section-label">Evidence Kate can use</h3><div className="divide-y divide-line">{context.signals.map(s => {
      const d = describeSignal(s);
      return <details key={s.id} className="evidence-row"><summary><span>{d.label}</span><strong>{d.value}</strong></summary><p>{kindLabel[s.kind]} · {s.source}</p><p>Valid until {formatDate(s.validUntil)}</p></details>;
    })}</div></section>
    <p className="text-xs leading-relaxed text-ink-3">Synthetic evidence only. Patterns do not establish your intent or verify an insurance policy.</p>
  </div>;
}
