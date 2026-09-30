'use client';

import { useSaving } from '@/components/session/SavingProvider';
import { formatCents, formatDate, formatMonth } from '@/components/format';
import { Card, Notice, ProgressBar } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { SavingKateCard } from './SavingCard';

export function SavingHome({ onOpenKate }: { onOpenKate: () => void }) {
  const { snapshot, transportError, reload } = useSaving();
  if (!snapshot) {
    return transportError
      ? <Notice tone="error" title="Could not load">{transportError} <button type="button" className="font-semibold underline" onClick={reload}>Try again</button></Notice>
      : <div role="status" className="h-60 animate-pulse rounded-lg bg-white" aria-label="Loading" />;
  }
  const { goal, baseline, projected } = snapshot;
  const changed = projected.completionDate !== baseline.completionDate || projected.monthlyCents !== baseline.monthlyCents;

  return (
    <div className="space-y-4">
      <Card aria-labelledby="goal-title">
        <div className="flex items-center gap-2 text-kbc-sky-dark"><Icon name="plane" /><span className="text-xs font-semibold uppercase tracking-wide">Your goal</span></div>
        <h2 id="goal-title" className="mt-1 text-2xl font-bold">{goal.title}</h2>
        <p className="text-sm text-kbc-muted">{formatCents(goal.targetCents)} by {formatDate(goal.deadline)}</p>

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Saved so far</span>
            <span className="tabular-nums"><strong className="text-2xl">{formatCents(goal.savedCents)}</strong> <span className="text-sm text-kbc-muted">of {formatCents(goal.targetCents)}</span></span>
          </div>
          <div className="mt-2"><ProgressBar value={goal.savedCents} max={goal.targetCents} label={`Actual progress: ${projected.progressPercent}% saved`} /></div>
          <div className="mt-1 flex justify-between text-xs text-kbc-muted">
            <span>{projected.progressPercent}% saved</span>
            <span>{formatCents(projected.remainingCents)} to go</span>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-kbc-sky bg-kbc-kate/50 p-3" aria-label="Projection">
          <p className="text-xs font-semibold uppercase tracking-wide text-kbc-sky-dark">Projection · not actual savings</p>
          <div className="mt-1 flex items-baseline justify-between gap-2 text-sm">
            <span>Planned per month</span>
            <span className="font-semibold tabular-nums">
              {changed ? <><s className="font-normal text-kbc-muted">{formatCents(baseline.monthlyCents)}</s> </> : null}
              {formatCents(projected.monthlyCents)}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2 text-sm">
            <span>Projected finish</span>
            <span className="font-semibold tabular-nums">
              {changed && baseline.completionDate ? <><s className="font-normal text-kbc-muted">{formatMonth(baseline.completionDate)}</s> </> : null}
              {projected.completionDate ? formatMonth(projected.completionDate) : 'Not reachable'}
            </span>
          </div>
          <p className={`mt-2 text-xs font-medium ${projected.onTrack ? 'text-kbc-ok' : 'text-kbc-warn'}`}>
            {projected.onTrack ? `On track for your ${formatMonth(goal.deadline)} deadline, if contributions continue.` : `After your ${formatMonth(goal.deadline)} deadline at this pace.`}
          </p>
          <p className="mt-1 text-xs text-kbc-muted">
            {projected.contributionsNeeded ?? '—'} monthly contributions from {formatDate(goal.firstContributionDate)}. No interest assumed.
          </p>
        </div>
      </Card>

      <SavingKateCard />

      <button type="button" onClick={onOpenKate} className="flex w-full items-center justify-between rounded-lg bg-white p-3 text-sm font-medium shadow-card hover:bg-kbc-kate">
        <span className="flex items-center gap-2"><Icon name="chat" /> Open your conversation with Kate</span>
        <Icon name="chevron" className="h-4 w-4" />
      </button>
    </div>
  );
}
