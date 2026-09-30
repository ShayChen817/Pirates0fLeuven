'use client';

import { useMoments } from '@/components/session/MomentsProvider';
import { formatCents } from '@/components/format';
import { Badge, Card } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { outcomeLabel, reasonText, ruleLabel } from './copy';

const outcomeTone = { selected: 'navy', deferred: 'warn', suppressed: 'muted' } as const;

export function EnginePanel() {
  const { snapshot, serviceLabel } = useMoments();
  return (
    <Card aria-label="Decision trace" className="!p-0 overflow-hidden">
      <div className="flex items-center gap-2 bg-kbc-navy px-4 py-3 text-white">
        <Icon name="engine" />
        <div>
          <h2 className="text-base font-semibold">Behind the scenes</h2>
          <p className="text-xs text-white/80">Demo-only view of the shared decision trace</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <Badge tone="warn">{serviceLabel}</Badge>
        {!snapshot ? <p role="status" className="text-sm text-kbc-muted">Loading…</p> : (
          <>
            <dl className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-kbc-bg p-2"><dt className="text-xs text-kbc-muted">Available</dt><dd className="font-bold tabular-nums">{formatCents(snapshot.availableCashCents)}</dd></div>
              <div className="rounded-lg bg-kbc-bg p-2"><dt className="text-xs text-kbc-muted">Revision</dt><dd className="font-bold tabular-nums">{snapshot.revision}</dd></div>
              <div className="rounded-lg bg-kbc-bg p-2"><dt className="text-xs text-kbc-muted">Context v.</dt><dd className="font-bold tabular-nums">{snapshot.context.version}</dd></div>
            </dl>
            <ol className="space-y-2" aria-label="Rules evaluated">
              {snapshot.decision.trace.map(row => (
                <li key={row.ruleId} className={`rounded-lg border p-3 ${row.outcome === 'selected' ? 'border-kbc-navy bg-kbc-kate' : 'border-kbc-line bg-white'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{ruleLabel[row.ruleId]}</p>
                    <Badge tone={outcomeTone[row.outcome]}>{outcomeLabel[row.outcome]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-kbc-navy/90">{reasonText[row.reasonCode]}</p>
                  {row.evidenceIds.length ? (
                    <p className="mt-1 text-xs text-kbc-muted">Evidence: {row.evidenceIds.join(', ')}</p>
                  ) : null}
                </li>
              ))}
            </ol>
            <p className="text-xs text-kbc-muted">Rules decide, Kate explains, Lotte confirms. At most one step is selected; the others show why they wait or stay quiet.</p>
          </>
        )}
      </div>
    </Card>
  );
}
