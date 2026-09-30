'use client';

import { useSaving } from '@/components/session/SavingProvider';
import { formatCents, formatDate } from '@/components/format';
import { Badge, Button, Card, Notice } from '@/components/ui/primitives';
import { subscriptionById } from './view';

export function SavingKnows() {
  const { snapshot, send, pending, error, clearError } = useSaving();
  if (!snapshot) return <div role="status" className="h-40 animate-pulse rounded-lg bg-white" aria-label="Loading" />;
  const { goal } = snapshot;
  const busy = !!pending;
  type Fact = { key: string; label: string; value: string; kind: 'You told Kate' | 'Observed' | 'Recorded' };
  const facts: Fact[] = [
    { key: 'goal', label: 'Goal', value: `${formatCents(goal.targetCents)} for ${goal.title} by ${formatDate(goal.deadline)}`, kind: 'You told Kate' },
    { key: 'saved', label: 'Saved so far', value: formatCents(goal.savedCents), kind: 'Observed' },
    { key: 'monthly', label: 'Monthly contribution', value: `${formatCents(goal.monthlyContributionCents)} from ${formatDate(goal.firstContributionDate)}`, kind: 'You told Kate' },
    ...snapshot.subscriptions.map(s => ({ key: s.merchantId, label: `${s.label} (recurring charge)`, value: `${formatCents(s.monthlyCents)}/month · ${s.evidenceIds.length} synthetic charges`, kind: 'Observed' as const })),
    ...snapshot.reviews.map(r => ({ key: `review-${r.merchantId}`, label: subscriptionById(snapshot, r.merchantId)?.label ?? r.merchantId,
      value: r.decision === 'unused' ? 'You no longer use it' : 'You keep it', kind: 'You told Kate' as const })),
    ...snapshot.intentions.map(i => ({ key: `plan-${i.merchantId}`, label: 'Saving intention',
      value: `${formatCents(i.monthlyCents)}/month towards ${goal.title} · subscription not cancelled`, kind: 'You told Kate' as const })),
    ...snapshot.contributions.map(c => ({ key: c.id, label: 'Recorded contribution', value: formatCents(c.amountCents), kind: 'Recorded' as const })),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">What Kate knows</h2>
        <p className="text-sm text-kbc-muted">For your {goal.title} goal. Synthetic data, this demo session only.</p>
      </div>
      {error ? <Notice tone="error" title="Not changed" onClose={clearError}>{error.message}</Notice> : null}
      <Card aria-label="Suggestions">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Saving suggestions</h3>
            <p className="text-xs text-kbc-muted">{snapshot.proactiveEnabled ? 'On. Kate may suggest one next step.' : 'Paused. Kate stays quiet.'}</p>
          </div>
          <Button variant="secondary" className="!px-3 !py-2 text-sm" busy={pending === 'SET_PROACTIVE'} disabled={busy}
            onClick={() => void send({ type: 'SET_PROACTIVE', enabled: !snapshot.proactiveEnabled })}>
            {snapshot.proactiveEnabled ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </Card>
      <Card aria-label="Facts">
        <ul className="space-y-2">
          {facts.map(f => (
            <li key={f.key} className="rounded-lg bg-kbc-bg p-3 text-sm">
              <div className="flex items-baseline justify-between gap-2"><span className="font-medium">{f.label}</span>
                <Badge tone={f.kind === 'Observed' ? 'muted' : 'ok'}>{f.kind}</Badge></div>
              <p className="mt-0.5 text-kbc-navy/90">{f.value}</p>
            </li>
          ))}
        </ul>
      </Card>
      <p className="text-xs text-kbc-muted">Lifestyle preferences are not inferred from your spending. They would only ever be something you choose to share.</p>
    </div>
  );
}
