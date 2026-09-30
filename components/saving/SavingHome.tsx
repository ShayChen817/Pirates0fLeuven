'use client';

import { useSaving } from '@/components/session/SavingProvider';
import { formatCents, formatDate, formatMonth } from '@/components/format';
import { AnimatedAmount, Body, Card, Hero, Notice, ProgressBar } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { SavingKateCard } from './SavingCard';
import { SpendingOverview } from './SpendingOverview';
import { InvestTip } from './InvestTip';

export function SavingHome({ onProfile }: { onProfile: () => void }) {
  const { snapshot, transportError, reload } = useSaving();
  if (!snapshot) {
    return (
      <>
        <Hero eyebrow="Hi Shay"><div className="mt-3 h-10 w-40 animate-pulse rounded-lg bg-white/15" /></Hero>
        <Body>
          {transportError
            ? <Notice tone="error" title="Could not load">{transportError} <button type="button" className="font-semibold underline" onClick={reload}>Try again</button></Notice>
            : <div role="status" aria-label="Loading" className="h-40 animate-pulse rounded-[var(--radius-card)] bg-surface" />}
        </Body>
      </>
    );
  }
  const { goal, baseline, projected } = snapshot;
  const improved = projected.completionDate !== baseline.completionDate;

  return (
    <>
      <Hero eyebrow={<span className="flex items-center gap-1.5"><Icon name="plane" className="h-4 w-4" />{goal.title} · by {formatDate(goal.deadline)}</span>}>
        <p className="mt-3 flex items-baseline gap-2">
          <AnimatedAmount cents={goal.savedCents} className="text-[40px] font-bold leading-none tracking-tight" />
          <span className="text-[15px] text-white/70">of {formatCents(goal.targetCents)}</span>
        </p>
        <div className="mt-4"><ProgressBar tone="light" value={goal.savedCents} max={goal.targetCents} label={`Actual progress: ${projected.progressPercent}% saved`} /></div>
        <p className="mt-2 flex justify-between text-[13px] text-white/75">
          <span>{projected.progressPercent}% saved</span><span>{formatCents(projected.remainingCents)} to go</span>
        </p>
      </Hero>
      <Body>
        <SavingKateCard onProfile={onProfile} />
        <Card aria-label="Projection">
          <p className="text-[13px] font-semibold text-ink-3">Projected finish <span className="font-normal">· a projection, not savings</span></p>
          <p className="mt-1 flex items-baseline gap-2">
            {improved && baseline.completionDate ? <s className="text-lg text-ink-3">{formatMonth(baseline.completionDate)}</s> : null}
            <span key={projected.completionDate} className="animate-pop text-2xl font-bold text-ink">
              {projected.remainingCents === 0 ? 'Goal reached' : projected.completionDate ? formatMonth(projected.completionDate) : 'Not reachable'}
            </span>
          </p>
          <p className={`mt-1 text-sm font-semibold ${projected.onTrack ? 'text-kbc-green-ink' : 'text-warn'}`}>
            {projected.onTrack ? 'On time for your deadline' : 'After your deadline at this pace'}
          </p>
          <details className="mt-3 border-t border-line pt-3 text-sm text-ink-2">
            <summary>How this is calculated</summary>
            <dl className="mt-2 space-y-2">
              <div className="flex justify-between gap-3"><dt>Planned per month</dt><dd className="tabular-nums font-semibold">{formatCents(projected.monthlyCents)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Payments to go</dt><dd>{projected.contributionsNeeded ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt>Starting</dt><dd className="text-right">{formatDate(goal.firstContributionDate)}</dd></div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-ink-3">No interest assumed. Only real contributions change what you have saved.</p>
          </details>
        </Card>
        <InvestTip />
        <SpendingOverview />
      </Body>
    </>
  );
}
