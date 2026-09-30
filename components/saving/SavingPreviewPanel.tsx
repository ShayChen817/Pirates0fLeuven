'use client';

import { useSaving } from '@/components/session/SavingProvider';
import { formatCents, formatMonth } from '@/components/format';
import { Badge } from '@/components/ui/primitives';
import { savingView } from './view';
import { useProfile } from '@/components/session/ProfileProvider';
import { subscriptionRelevance } from '@/lib/profile';

const viewLabel = {
  review: 'Ask: review subscriptions', intention: 'Offer: saving intention', planned: 'Quiet: plan recorded',
  kept: 'Quiet: service kept', snoozed: 'Quiet: snoozed 30 days', paused: 'Quiet: suggestions paused', quiet: 'Quiet',
} as const;

export function SavingPreviewPanel() {
  const { snapshot } = useSaving();
  const { snapshot: profile } = useProfile();
  const relevance = profile ? subscriptionRelevance(profile) : 'setup';
  const view = snapshot ? savingView(snapshot) : null;
  const next = view === 'review' && relevance !== 'matched'
    ? { setup: 'Ask: set preferences', review: 'Ask: confirm preferences', unmatched: 'Quiet: no matching preference' }[relevance]
    : view ? viewLabel[view] : 'Loading';
  return (
    <section aria-label="Saving decision details" className="rounded-[var(--radius-card)] bg-surface p-5 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">Behind the scenes</h2>
        <span className="text-xs text-ink-3">Saving service · rev {snapshot?.revision ?? '–'}</span>
      </div>
      {!snapshot ? <p role="status" className="mt-3 text-sm text-ink-3">Loading…</p> : (
        <>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-sm text-ink-2">Kate&apos;s next step</p>
            <Badge tone={snapshot.primary && relevance === 'matched' ? 'navy' : 'muted'}>{next}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {([['Baseline', snapshot.baseline], ['With plan', snapshot.projected]] as const).map(([label, p]) => (
              <div key={label} className="rounded-xl bg-canvas p-3">
                <p className="text-xs font-semibold text-ink-3">{label}</p>
                <p key={p.completionDate} className="mt-1 animate-fade text-lg font-bold text-ink">{p.completionDate ? formatMonth(p.completionDate) : '—'}</p>
                <p className="text-[13px] tabular-nums text-ink-3">{formatCents(p.monthlyCents)}/mo · {p.contributionsNeeded ?? '—'} payments</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-snug text-ink-3">
            Evidence: {snapshot.subscriptions.length} charges seen three times, a month apart. Saved stays {formatCents(snapshot.goal.savedCents)}: plans move the projection, never the balance. No interest assumed.
          </p>
        </>
      )}
    </section>
  );
}
