'use client';

import { useMoments } from '@/components/session/MomentsProvider';
import { AnimatedAmount, Badge } from '@/components/ui/primitives';
import { outcomeLabel, reasonText, ruleLabel } from './copy';

const outcomeTone = { selected: 'navy', deferred: 'warn', suppressed: 'muted' } as const;

export function EnginePanel() {
  const { snapshot } = useMoments();
  return (
    <section aria-label="Decision trace" className="rounded-[var(--radius-card)] bg-surface p-5 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">Behind the scenes</h2>
        <span className="text-xs text-ink-3">Moments engine · rev {snapshot?.revision ?? '–'}</span>
      </div>
      {!snapshot ? <p role="status" className="mt-3 text-sm text-ink-3">Loading…</p> : (
        <>
          <p className="mt-3 text-[13px] text-ink-3">Potentially available</p>
          <AnimatedAmount cents={snapshot.availableCashCents} className="text-2xl font-bold text-ink" />
          <ol className="mt-4 divide-y divide-line" aria-label="Rules evaluated">
            {snapshot.decision.trace.map(row => (
              <li key={row.ruleId} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${row.outcome === 'selected' ? 'text-ink' : 'text-ink-2'}`}>{ruleLabel[row.ruleId]}</p>
                  <Badge tone={outcomeTone[row.outcome]}>{outcomeLabel[row.outcome]}</Badge>
                </div>
                <p key={row.reasonCode} className="mt-0.5 animate-fade text-[13px] leading-snug text-ink-3">{reasonText[row.reasonCode]}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-ink-3">Rules decide, Kate explains, Shay confirms. One step at a time.</p>
        </>
      )}
    </section>
  );
}
