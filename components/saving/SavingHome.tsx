'use client';

// DEMO: Saving concept preview — not connected to the engine.
import { useSaving } from '@/components/session/SavingProvider';
import { formatCents, formatDate, formatMonth } from '@/components/format';
import { Badge, Card, ProgressBar } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { plannedMonthlyCents, project, SAVING_PREVIEW_LABEL, savingScenario } from '@/components/demo/savingPreview';
import { SavingKateCard } from './SavingCard';

export function SavingHome({ onOpenKate }: { onOpenKate: () => void }) {
  const { state } = useSaving();
  const { goal, contribution } = savingScenario;
  const pct = (goal.savedCents / goal.targetCents) * 100;
  const baseline = project(contribution.amountCents);
  const current = project(plannedMonthlyCents(state));
  const changed = current.completionDate !== baseline.completionDate;

  return (
    <div className="space-y-4">
      <Card aria-labelledby="goal-title">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-kbc-sky-dark"><Icon name="plane" /><span className="text-xs font-semibold uppercase tracking-wide">Your goal</span></div>
          <Badge tone="warn">{SAVING_PREVIEW_LABEL}</Badge>
        </div>
        <h2 id="goal-title" className="mt-1 text-2xl font-bold">{goal.name}</h2>
        <p className="text-sm text-kbc-muted">{formatCents(goal.targetCents)} by {formatDate(goal.deadline)}</p>

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Saved so far</span>
            <span className="tabular-nums"><strong className="text-2xl">{formatCents(goal.savedCents)}</strong> <span className="text-sm text-kbc-muted">of {formatCents(goal.targetCents)}</span></span>
          </div>
          <div className="mt-2"><ProgressBar value={goal.savedCents} max={goal.targetCents} label={`Actual progress: ${pct.toFixed(1)}% saved`} /></div>
          <div className="mt-1 flex justify-between text-xs text-kbc-muted">
            <span>{pct.toFixed(1)}% saved</span>
            <span>{formatCents(goal.targetCents - goal.savedCents)} to go</span>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-kbc-sky bg-kbc-kate/50 p-3" aria-label="Projection">
          <p className="text-xs font-semibold uppercase tracking-wide text-kbc-sky-dark">Projection · not actual savings</p>
          <div className="mt-1 flex items-baseline justify-between gap-2 text-sm">
            <span>Planned per month</span>
            <span className="tabular-nums font-semibold">
              {changed ? <><s className="font-normal text-kbc-muted">{formatCents(contribution.amountCents)}</s> </> : null}
              {formatCents(current.monthlyCents)}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2 text-sm">
            <span>Projected finish</span>
            <span className="tabular-nums font-semibold">
              {changed ? <><s className="font-normal text-kbc-muted">{formatMonth(baseline.completionDate)}</s> </> : null}
              {formatMonth(current.completionDate)}
            </span>
          </div>
          <p className={`mt-2 text-xs font-medium ${current.meetsDeadline ? 'text-kbc-ok' : 'text-kbc-warn'}`}>
            {current.meetsDeadline ? `On track for your ${formatMonth(goal.deadline)} deadline, if contributions continue.` : `One month after your ${formatMonth(goal.deadline)} deadline.`}
          </p>
          <p className="mt-1 text-xs text-kbc-muted">{current.contributions} contributions {contribution.label} from {formatDate(contribution.firstDate)}. No interest assumed.</p>
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
