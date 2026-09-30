'use client';

import { useSaving } from '@/components/session/SavingProvider';
import { formatCents, formatDate } from '@/components/format';
import { Badge, Card, Row } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { savingView } from './view';

const viewLabel = {
  review: 'Ask: review subscriptions', intention: 'Offer: saving intention', planned: 'Quiet: intention planned',
  kept: 'Quiet: customer keeps service', snoozed: 'Quiet: snoozed 30 days', paused: 'Quiet: suggestions paused', quiet: 'Quiet',
} as const;

export function SavingPreviewPanel() {
  const { snapshot } = useSaving();
  return (
    <Card aria-label="Saving decision details" className="!p-0 overflow-hidden">
      <div className="flex items-center gap-2 bg-kbc-navy px-4 py-3 text-white">
        <Icon name="engine" />
        <div>
          <h2 className="text-base font-semibold">Behind the scenes</h2>
          <p className="text-xs text-white/80">Saving service (saving-1.0)</p>
        </div>
      </div>
      <div className="space-y-3 p-4 text-sm">
        <Badge tone="warn">In-process service · synthetic data</Badge>
        {!snapshot ? <p role="status" className="text-kbc-muted">Loading…</p> : (
          <>
            <dl>
              <Row label="Kate's next step" value={viewLabel[savingView(snapshot)]} />
              <Row label="Revision" value={snapshot.revision} />
              <Row label="Subscriptions detected" value={`${snapshot.subscriptions.length} (three equal monthly charges)`} />
              <Row label="Remaining gap" value={formatCents(snapshot.projected.remainingCents)} />
            </dl>
            <div className="grid grid-cols-2 gap-2">
              {([['Baseline', snapshot.baseline], ['With your plan', snapshot.projected]] as const).map(([label, p]) => (
                <div key={label} className="rounded-lg bg-kbc-bg p-3">
                  <p className="text-xs font-semibold text-kbc-muted">{label}</p>
                  <p className="mt-1 tabular-nums">{formatCents(p.monthlyCents)}/month</p>
                  <p className="tabular-nums">{p.contributionsNeeded ?? '—'} contributions</p>
                  <p className="font-semibold tabular-nums">{p.completionDate ? formatDate(p.completionDate) : '—'}</p>
                  <p className="text-xs text-kbc-muted">At deadline: {formatCents(p.deadlineBalanceCents)}</p>
                </div>
              ))}
            </div>
            <dl><Row muted label="Actual saved (only changes with recorded contributions)" value={formatCents(snapshot.goal.savedCents)} /></dl>
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-kbc-muted">
              {snapshot.projected.assumptions.map(a => <li key={a}>{a}</li>)}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}
