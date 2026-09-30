'use client';

import { useMoments } from '@/components/session/MomentsProvider';
import { formatCents, formatDate } from '@/components/format';
import { AnimatedAmount, Body, Card, Hero, Notice, ProgressBar } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { PrimaryActionCard, MoneyRows } from './PrimaryAction';
import { byRule, movingSteps, type StepState } from './copy';

export function MovingHome() {
  const { snapshot, transportError, reload } = useMoments();

  if (!snapshot) {
    return (
      <>
        <Hero eyebrow="Hi Lotte"><div className="mt-3 h-10 w-40 animate-pulse rounded-lg bg-white/15" /></Hero>
        <Body>
          {transportError
            ? <Notice tone="error" title="Could not load">{transportError} <button type="button" className="font-semibold underline" onClick={reload}>Try again</button></Notice>
            : <div role="status" aria-label="Loading" className="h-40 animate-pulse rounded-[var(--radius-card)] bg-surface" />}
        </Body>
      </>
    );
  }

  const { context } = snapshot;
  const move = context.commitments.find(c => c.purpose === 'moving');
  const steps = move ? movingSteps(snapshot) : null;
  const done = steps?.filter(s => s.state === 'done').length ?? 0;
  const simulation = byRule(snapshot, 'explore-investment');

  return (
    <>
      {move && steps ? (
        <Hero eyebrow={<span className="flex items-center gap-1.5"><Icon name="box" className="h-4 w-4" />Your move · {formatDate(move.dueDate)}</span>}>
          <p className="mt-3 flex items-baseline gap-2">
            <AnimatedAmount cents={snapshot.availableCashCents} className="text-[40px] font-bold leading-none tracking-tight" />
            <span className="text-[15px] text-white/70">left to plan with</span>
          </p>
          <div className="mt-4"><ProgressBar tone="light" value={done} max={steps.length} label="Moving plan progress" /></div>
          <p className="mt-2 text-[13px] text-white/75">{done} of {steps.length} steps · {formatCents(move.amountCents)} kept for the move</p>
        </Hero>
      ) : (
        <Hero eyebrow={context.intent === 'long-term' ? `Long-term goal · ${context.horizonYears} years` : 'Hi Lotte'}>
          <p className="mt-3 flex items-baseline gap-2">
            <AnimatedAmount cents={snapshot.availableCashCents} className="text-[40px] font-bold leading-none tracking-tight" />
          </p>
          <p className="mt-2 text-[13px] text-white/75">Potentially available to plan with · current account {formatCents(context.accessibleCashCents)}</p>
        </Hero>
      )}
      <Body>
        <PrimaryActionCard />
        {simulation?.status === 'completed' ? (
          <Card aria-label="Simulation">
            <p className="flex items-center gap-2 text-sm font-semibold text-kbc-green-ink"><Icon name="check" className="h-4 w-4" />Simulation confirmed</p>
            <p className="mt-1 text-[15px] text-ink-2">{simulation.message}</p>
          </Card>
        ) : null}
        {steps ? <Steps steps={steps} /> : null}
        <Card aria-label="Current account">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tint text-kbc-blue-ink"><Icon name="card" /></span>
                <span><span className="block text-[15px] font-semibold">Current account</span><span className="block text-xs text-ink-3">How is this calculated?</span></span>
              </span>
              <span className="flex items-center gap-2 text-lg font-bold tabular-nums">{formatCents(context.accessibleCashCents)}
                <Icon name="chevron" className="h-4 w-4 text-ink-3 transition-transform duration-200 group-open:rotate-90" /></span>
            </summary>
            <div className="mt-3 animate-fade"><MoneyRows snapshot={snapshot} /></div>
          </details>
        </Card>
      </Body>
    </>
  );
}

const dot: Record<StepState, string> = {
  done: 'bg-kbc-green text-white', current: 'bg-kbc-blue text-white ring-4 ring-kbc-blue/20', upcoming: 'bg-canvas text-ink-3 ring-1 ring-line',
};

function Steps({ steps }: { steps: ReturnType<typeof movingSteps> }) {
  return (
    <Card aria-label="Your moving plan">
      <h3 className="text-[15px] font-semibold">Your plan</h3>
      <ol className="mt-3">
        {steps.map((s, i) => (
          <li key={s.id} className="relative flex gap-3 pb-4 last:pb-0" aria-current={s.state === 'current' ? 'step' : undefined}>
            {i < steps.length - 1 ? <span className={`absolute left-[13px] top-7 h-[calc(100%-24px)] w-0.5 ${s.state === 'done' ? 'bg-kbc-green' : 'bg-line'}`} aria-hidden="true" /> : null}
            <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${dot[s.state]}`}>
              {s.state === 'done' ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={`text-[15px] font-semibold ${s.state === 'upcoming' ? 'text-ink-3' : 'text-ink'}`}>
                {s.title}<span className="sr-only"> — {s.state === 'done' ? 'done' : s.state === 'current' ? 'current step' : 'upcoming'}</span>
              </p>
              <p className="text-[13px] text-ink-3">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
