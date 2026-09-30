'use client';

// DEMO: Saving concept preview — not connected to the engine.
import { useSaving } from '@/components/session/SavingProvider';
import { formatCents, formatDate } from '@/components/format';
import { Badge, Card } from '@/components/ui/primitives';
import { savingScenario, streamById } from '@/components/demo/savingPreview';

export function SavingKnows() {
  const { state } = useSaving();
  const { goal, contribution, streams } = savingScenario;
  const stream = streamById(state.identifiedStreamId);
  const facts: { label: string; value: string; kind: 'You told Kate' | 'Observed' }[] = [
    { label: 'Goal', value: `${formatCents(goal.targetCents)} for Japan by ${formatDate(goal.deadline)}`, kind: 'You told Kate' },
    { label: 'Saved so far', value: formatCents(goal.savedCents), kind: 'Observed' },
    { label: 'Monthly contribution', value: `${formatCents(contribution.amountCents)} ${contribution.label}, from ${formatDate(contribution.firstDate)}`, kind: 'You told Kate' },
    ...streams.map(s => ({ label: `${s.label} (recurring charge)`, value: `${formatCents(s.amountCents)}/month`, kind: 'Observed' as const })),
  ];
  if (stream && state.status !== 'dismissed') {
    facts.push({ label: `You no longer use ${stream.label}`, value: state.status === 'kept' ? 'You chose to keep it' : 'Your answer', kind: 'You told Kate' });
  }
  if (state.status === 'planned' && stream) {
    facts.push({ label: 'Saving intention', value: `${formatCents(stream.amountCents)}/month towards Japan · subscription not cancelled`, kind: 'You told Kate' });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">What Kate knows</h2>
        <p className="text-sm text-kbc-muted">For your Japan goal. Synthetic data, this preview session only. Use Reset demo to start over.</p>
      </div>
      <Card aria-label="Facts">
        <ul className="space-y-2">
          {facts.map(f => (
            <li key={f.label} className="rounded-lg bg-kbc-bg p-3 text-sm">
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
