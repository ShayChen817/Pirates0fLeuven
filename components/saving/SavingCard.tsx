'use client';

// DEMO: Saving concept preview — not connected to the engine.
import { useState } from 'react';
import { useSaving } from '@/components/session/SavingProvider';
import { formatCents, formatDate, formatMonth } from '@/components/format';
import { Button, KateCard, Row, Sheet } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { OPENING_QUESTION, project, savingScenario, streamById, streamsTotalCents } from '@/components/demo/savingPreview';

/** The one Kate advice card for the Saving preview. Home and Kate tab render the same state. */
export function SavingKateCard() {
  const { state, dispatch } = useSaving();
  const [sheet, setSheet] = useState<'evidence' | 'why' | null>(null);
  const stream = streamById(state.identifiedStreamId);
  const base = savingScenario.contribution.amountCents;
  const why = <Button variant="text" onClick={() => setSheet('why')}>Why this?</Button>;

  let card;
  switch (state.status) {
    case 'suggested':
      card = (
        <KateCard title="A small review for your Japan goal" footer={<>
          <Button onClick={() => setSheet('evidence')}>Review the charges</Button>
          <Button variant="chip" onClick={() => dispatch({ type: 'NOT_NOW' })}>Not now</Button>
          {why}
        </>}>{OPENING_QUESTION}</KateCard>
      );
      break;
    case 'identified': {
      const baseline = project(base);
      const revised = project(base + (stream?.amountCents ?? 0));
      card = (
        <KateCard title={`What if ${stream?.label} went towards Japan?`} footer={<>
          <Button onClick={() => dispatch({ type: 'ADD_TO_PLAN' })}>Add to my plan</Button>
          <Button variant="chip" onClick={() => dispatch({ type: 'KEEP_SERVICE' })}>Keep this service</Button>
          <Button variant="chip" onClick={() => dispatch({ type: 'NOT_NOW' })}>Not now</Button>
          {why}
        </>}>
          <p>If you stop this charge and put that {formatCents(stream?.amountCents ?? 0)}/month towards Japan, your projected finish changes from {formatMonth(baseline.completionDate).split(' ')[0]} to {formatMonth(revised.completionDate).split(' ')[0]}.</p>
          <dl className="mt-2 rounded-lg bg-white p-3">
            <Row label="Planned per month" value={<>{formatCents(base)} → <strong>{formatCents(revised.monthlyCents)}</strong></>} />
            <Row label="Projected finish" value={<>{formatMonth(baseline.completionDate)} → <strong>{formatMonth(revised.completionDate)}</strong></>} />
          </dl>
          <p className="mt-2 text-xs text-kbc-muted">Projection only: assumes the charge stops, the amount is redirected, contributions are uninterrupted and there is no interest.</p>
        </KateCard>
      );
      break;
    }
    case 'planned':
      card = (
        <KateCard tone="quiet" title="Planned; subscription not cancelled." footer={why}>
          <p>You plan to put {formatCents(stream?.amountCents ?? 0)}/month from {stream?.label} towards Japan. Cancelling it is up to you; Kate contacted no provider.</p>
          <p className="mt-1">Your saved amount stays {formatCents(savingScenario.goal.savedCents)} until contributions actually arrive.</p>
        </KateCard>
      );
      break;
    case 'kept':
      card = (
        <KateCard tone="quiet" title="Got it, the service stays">
          {stream?.label} stays in your budget. No saving is counted and your projection is unchanged.
        </KateCard>
      );
      break;
    case 'dismissed':
      card = (
        <KateCard tone="quiet" title="Okay, not now">
          Kate stays quiet about this in the preview. Your Japan plan is unchanged.
        </KateCard>
      );
      break;
  }

  return (
    <>
      {card}
      {sheet === 'evidence' ? <EvidenceSheet onClose={() => setSheet(null)} /> : null}
      {sheet === 'why' ? <WhySheet onClose={() => setSheet(null)} /> : null}
    </>
  );
}

function EvidenceSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useSaving();
  return (
    <Sheet title="Recurring charges" onClose={onClose}>
      <p className="text-sm text-kbc-navy/90">
        Three synthetic streaming charges, {formatCents(streamsTotalCents)}/month in total. A recurring payment shows spending, not whether you still use the service. Only you know that.
      </p>
      <ul className="mt-3 space-y-2">
        {savingScenario.streams.map(s => (
          <li key={s.id} className="rounded-lg border border-kbc-line p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{s.label}</span>
              <span className="tabular-nums">{formatCents(s.amountCents)}/month</span>
            </div>
            <p className="mt-0.5 text-xs text-kbc-muted">Synthetic charges on {s.charges.map(formatDate).join(', ')}</p>
            <Button variant="chip" className="mt-2" onClick={() => { dispatch({ type: 'IDENTIFY_STREAM', streamId: s.id }); onClose(); }}>
              I no longer use this
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="secondary" className="mt-4 w-full" onClick={onClose}>I use all of them</Button>
    </Sheet>
  );
}

function WhySheet({ onClose }: { onClose: () => void }) {
  const { goal, contribution } = savingScenario;
  const baseline = project(contribution.amountCents);
  return (
    <Sheet title="Why this?" onClose={onClose}>
      <ul className="space-y-2 text-sm">
        <li className="flex gap-2"><Icon name="plane" className="h-4 w-4 shrink-0 text-kbc-sky-dark" />
          You set a goal: {formatCents(goal.targetCents)} for Japan by {formatDate(goal.deadline)}.</li>
        <li className="flex gap-2"><Icon name="chart" className="h-4 w-4 shrink-0 text-kbc-sky-dark" />
          With {formatCents(contribution.amountCents)} {contribution.label} from {formatDate(contribution.firstDate)}, the projected finish is {formatMonth(baseline.completionDate)}, one month after your deadline.</li>
        <li className="flex gap-2"><Icon name="card" className="h-4 w-4 shrink-0 text-kbc-sky-dark" />
          Three recurring streaming charges ({formatCents(streamsTotalCents)}/month) appear in your synthetic transactions.</li>
      </ul>
      <p className="mt-3 rounded-lg bg-kbc-kate p-3 text-xs text-kbc-navy/90">
        Kate does not know whether you use a service, whether services overlap or what alternatives cost. She only asks. Nothing is cancelled and no provider is contacted.
      </p>
    </Sheet>
  );
}
