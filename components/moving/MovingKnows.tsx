'use client';

import { useMoments } from '@/components/session/MomentsProvider';
import { formatCents, formatDate } from '@/components/format';
import { Badge, Button, Card, Notice } from '@/components/ui/primitives';
import { describeSignal, kindLabel } from './copy';

export function MovingKnows() {
  const { snapshot, send, pending, error, clearError } = useMoments();
  if (!snapshot) return <div role="status" className="h-40 animate-pulse rounded-lg bg-white" aria-label="Loading" />;
  const { context } = snapshot;
  const move = context.commitments.find(c => c.purpose === 'moving');
  const busy = !!pending;

  const plans = [
    move && { field: 'moving' as const, label: 'Moving plan', value: `${formatCents(move.amountCents)} by ${formatDate(move.dueDate)}` },
    context.intent !== 'unknown' && { field: 'intent' as const, label: 'What the money is for',
      value: context.intent === 'near-term' ? 'A near-term plan' : `Long-term goal, ${context.horizonYears} years` },
    context.coverage !== 'unknown' && { field: 'coverage' as const, label: 'Home cover',
      value: context.coverage === 'confirmed-covered' ? 'Insured elsewhere (you told Kate; not verified)' : 'You need cover' },
  ].filter(Boolean) as { field: 'moving' | 'intent' | 'coverage'; label: string; value: string }[];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">What Kate knows</h2>
        <p className="text-sm text-kbc-muted">Facts from this demo session, with where they came from. Correct anything that is wrong.</p>
      </div>
      {error ? <Notice tone="error" title="Not changed" onClose={clearError}>{error.message}</Notice> : null}

      <Card aria-label="Your answers">
        <h3 className="text-sm font-semibold">Your answers</h3>
        {plans.length === 0 ? <p className="mt-1 text-sm text-kbc-muted">You have not told Kate about any plans yet.</p> : (
          <ul className="mt-2 divide-y divide-kbc-line">
            {plans.map(p => (
              <li key={p.field} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0"><p className="text-sm font-medium">{p.label}</p><p className="text-xs text-kbc-muted">{p.value}</p></div>
                <Button variant="text" disabled={busy} onClick={() => void send({ type: 'CLEAR_CONTEXT', field: p.field })}>Clear</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card aria-label="Suggestions">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Proactive suggestions</h3>
            <p className="text-xs text-kbc-muted">{context.proactiveEnabled ? 'On. Kate may suggest one next step.' : 'Paused. Kate stays quiet.'}</p>
          </div>
          <Button variant="secondary" className="!px-3 !py-2 text-sm" busy={pending === 'SET_PROACTIVE'} disabled={busy}
            onClick={() => void send({ type: 'SET_PROACTIVE', enabled: !context.proactiveEnabled })}>
            {context.proactiveEnabled ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </Card>

      <Card aria-label="Evidence">
        <h3 className="text-sm font-semibold">Evidence Kate can use</h3>
        <ul className="mt-2 space-y-2">
          {context.signals.map(s => {
            const d = describeSignal(s);
            return (
              <li key={s.id} className="rounded-lg bg-kbc-bg p-3 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{d.label}</span><span className="text-right tabular-nums">{d.value}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-kbc-muted">
                  <Badge tone={s.kind === 'customer-confirmed' ? 'ok' : s.kind === 'inferred' ? 'warn' : 'muted'}>{kindLabel[s.kind]}</Badge>
                  <span>{s.source}</span><span>· valid until {formatDate(s.validUntil)}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-kbc-muted">Monthly history ({context.monthlyHistory.length} months) is background only; it does not show what the money is for.</p>
      </Card>
    </div>
  );
}
