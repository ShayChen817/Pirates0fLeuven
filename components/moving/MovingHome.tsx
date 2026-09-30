'use client';

import { useMoments } from '@/components/session/MomentsProvider';
import { formatCents, formatDate } from '@/components/format';
import { Badge, Card, Notice, ProgressBar } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { PrimaryActionCard, MoneyRows } from './PrimaryAction';
import { byRule, movingSteps, type StepState } from './copy';

export function MovingHome({ onOpenKate }: { onOpenKate: () => void }) {
  const { snapshot, transportError, reload } = useMoments();

  if (!snapshot) {
    return transportError
      ? <Notice tone="error" title="Could not load">{transportError} <button type="button" className="font-semibold underline" onClick={reload}>Try again</button></Notice>
      : <div role="status" className="h-40 animate-pulse rounded-lg bg-white" aria-label="Loading" />;
  }

  const { context } = snapshot;
  const move = context.commitments.find(c => c.purpose === 'moving');
  const simulation = byRule(snapshot, 'explore-investment');

  return (
    <div className="space-y-4">
      {move ? <MoveHero /> : context.intent === 'long-term' ? (
        <Card aria-label="Your long-term goal">
          <div className="flex items-center gap-2 text-kbc-sky-dark"><Icon name="chart" /><span className="text-xs font-semibold uppercase tracking-wide">Your goal</span></div>
          <h2 className="mt-1 text-2xl font-bold">Grow money over {context.horizonYears} years</h2>
          <p className="mt-1 text-sm text-kbc-muted">You confirmed a long-term goal and no other large expenses.</p>
          {simulation?.status === 'completed' ? (
            <div className="mt-3 rounded-lg bg-kbc-ok-soft p-3 text-sm text-kbc-ok">
              <p className="font-semibold">{simulation.title}</p>
              <p className="text-kbc-navy/90">{simulation.message}</p>
            </div>
          ) : null}
        </Card>
      ) : (
        <Card aria-label="Your money picture">
          <p className="text-xs font-semibold uppercase tracking-wide text-kbc-sky-dark">Your money picture</p>
          <p className="mt-1 text-sm text-kbc-muted">Potentially available to plan with</p>
          <p className="text-3xl font-bold tabular-nums">{formatCents(snapshot.availableCashCents)}</p>
          <p className="mt-1 text-xs text-kbc-muted">Based on what Kate knows today. Not yet assigned to any goal.</p>
        </Card>
      )}

      <PrimaryActionCard />

      <Card aria-label="Current account">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-kbc-kate text-kbc-navy"><Icon name="card" /></span>
            <div>
              <p className="text-sm font-semibold">Current account</p>
              <p className="text-xs text-kbc-muted">BE00 0000 0000 0000 · synthetic</p>
            </div>
          </div>
          <p className="text-lg font-bold tabular-nums">{formatCents(context.accessibleCashCents)}</p>
        </div>
        <details className="mt-3 border-t border-kbc-line pt-2">
          <summary className="cursor-pointer text-sm font-medium text-kbc-sky-dark">How much is potentially available?</summary>
          <div className="mt-2"><MoneyRows snapshot={snapshot} /></div>
        </details>
      </Card>

      <button type="button" onClick={onOpenKate} className="flex w-full items-center justify-between rounded-lg bg-white p-3 text-sm font-medium shadow-card hover:bg-kbc-kate">
        <span className="flex items-center gap-2"><Icon name="chat" /> Open your conversation with Kate</span>
        <Icon name="chevron" className="h-4 w-4" />
      </button>
    </div>
  );
}

const stepStyles: Record<StepState, string> = {
  done: 'bg-kbc-ok text-white', current: 'bg-kbc-sky text-white ring-4 ring-kbc-sky/25', upcoming: 'bg-kbc-line text-kbc-muted',
};

function MoveHero() {
  const { snapshot } = useMoments();
  if (!snapshot) return null;
  const move = snapshot.context.commitments.find(c => c.purpose === 'moving')!;
  const steps = movingSteps(snapshot);
  const done = steps.filter(s => s.state === 'done').length;

  return (
    <Card aria-labelledby="your-move">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-kbc-sky-dark"><Icon name="box" /><span className="text-xs font-semibold uppercase tracking-wide">Life mission</span></div>
        <Badge tone={done === steps.length ? 'ok' : 'sky'}>{done} of {steps.length} steps</Badge>
      </div>
      <h2 id="your-move" className="mt-1 text-2xl font-bold">Your move</h2>
      <p className="text-sm text-kbc-muted">{formatCents(move.amountCents)} to pay by {formatDate(move.dueDate)}</p>
      <div className="mt-3"><ProgressBar value={done} max={steps.length} label="Moving plan progress" /></div>
      <div className="mt-3 flex items-baseline justify-between rounded-lg bg-kbc-bg p-3">
        <span className="text-sm">Potentially available after the move</span>
        <span className="text-xl font-bold tabular-nums">{formatCents(snapshot.availableCashCents)}</span>
      </div>
      <ol className="mt-3 space-y-3">
        {steps.map((s, i) => (
          <li key={s.id} className="flex gap-3" aria-current={s.state === 'current' ? 'step' : undefined}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${stepStyles[s.state]}`}>
              {s.state === 'done' ? <Icon name="check" className="h-4 w-4" /> : i + 1}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${s.state === 'upcoming' ? 'text-kbc-muted' : ''}`}>
                {s.title}<span className="sr-only"> — {s.state === 'done' ? 'done' : s.state === 'current' ? 'current step' : 'upcoming'}</span>
              </p>
              <p className="text-xs text-kbc-muted">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
