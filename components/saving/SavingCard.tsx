'use client';

import { useState } from 'react';
import { useSaving } from '@/components/session/SavingProvider';
import { projectGoal } from '@/lib/saving';
import { formatCents, formatDate, formatMonth } from '@/components/format';
import { Button, KateCard, Notice, Row, Sheet } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { evidenceDates, savingView, subscriptionById } from './view';

const monthName = (iso: string | null) => (iso ? formatMonth(iso).split(' ')[0] : '—');

/** The one Kate advice card for Saving. Home and the Kate tab render the same service state. */
export function SavingKateCard() {
  const { snapshot, send, pending, error, transportError, clearError } = useSaving();
  const [sheet, setSheet] = useState<'evidence' | 'why' | null>(null);
  if (!snapshot) {
    return <div role="status" className="h-32 animate-pulse rounded-lg bg-kbc-kate" aria-label="Loading" />;
  }
  const busy = !!pending;
  const view = savingView(snapshot);
  const why = <Button variant="text" onClick={() => setSheet('why')}>Why this?</Button>;
  const notNow = <Button variant="chip" disabled={busy} busy={pending === 'SNOOZE_ADVICE'} onClick={() => void send({ type: 'SNOOZE_ADVICE' })}>Not now</Button>;

  let card;
  switch (view) {
    case 'review':
      card = (
        <KateCard title="A small review for your goal" footer={<>
          <Button disabled={busy} onClick={() => setSheet('evidence')}>Review the charges</Button>{notNow}{why}
        </>}>{snapshot.primary!.message}</KateCard>
      );
      break;
    case 'intention': {
      const sub = subscriptionById(snapshot, snapshot.primary!.merchantId)!;
      // Preview with the backend's own projection function; nothing is recorded until "Add to my plan".
      const revised = projectGoal(snapshot.goal, sub.monthlyCents);
      const baseline = snapshot.baseline;
      card = (
        <KateCard title={`What if ${sub.label} went towards ${snapshot.goal.title}?`} footer={<>
          <Button busy={pending === 'ADD_SAVING_INTENTION'} disabled={busy}
            onClick={() => void send({ type: 'ADD_SAVING_INTENTION', merchantId: sub.merchantId })}>Add to my plan</Button>
          <Button variant="chip" disabled={busy} busy={pending === 'REVIEW_SUBSCRIPTION'}
            onClick={() => void send({ type: 'REVIEW_SUBSCRIPTION', merchantId: sub.merchantId, decision: 'keep' })}>Keep this service</Button>
          {notNow}{why}
        </>}>
          <p>If you stop this charge and put that {formatCents(sub.monthlyCents)}/month towards Japan, your projected finish changes from {monthName(baseline.completionDate)} to {monthName(revised.completionDate)}.</p>
          <dl className="mt-2 rounded-lg bg-white p-3">
            <Row label="Planned per month" value={<>{formatCents(baseline.monthlyCents)} → <strong>{formatCents(revised.monthlyCents)}</strong></>} />
            <Row label="Projected finish" value={<>{baseline.completionDate ? formatMonth(baseline.completionDate) : '—'} → <strong>{revised.completionDate ? formatMonth(revised.completionDate) : '—'}</strong></>} />
          </dl>
          <p className="mt-2 text-xs text-kbc-muted">Projection only: assumes the charge stops, the amount is redirected, contributions continue and there is no interest.</p>
        </KateCard>
      );
      break;
    }
    case 'planned': {
      const intention = snapshot.intentions[0];
      const sub = subscriptionById(snapshot, intention.merchantId);
      card = (
        <KateCard tone="quiet" title="Planned; subscription not cancelled." footer={<>
          <Button variant="chip" disabled={busy} busy={pending === 'REMOVE_SAVING_INTENTION'}
            onClick={() => void send({ type: 'REMOVE_SAVING_INTENTION', merchantId: intention.merchantId })}>Remove from plan</Button>{why}
        </>}>
          <p>You plan to put {formatCents(intention.monthlyCents)}/month from {sub?.label ?? 'this service'} towards {snapshot.goal.title}. Cancelling is up to you; Kate contacted no provider.</p>
          <p className="mt-1">Your saved amount stays {formatCents(snapshot.goal.savedCents)} until contributions actually arrive.</p>
        </KateCard>
      );
      break;
    }
    case 'kept':
      card = <KateCard tone="quiet" title="Got it, the service stays">No saving is counted and your projection is unchanged. Kate will not push another review right now.</KateCard>;
      break;
    case 'snoozed':
      card = <KateCard tone="quiet" title="Okay, not now">Kate stays quiet about this until {formatDate(snapshot.snoozedUntil!)}. Your plan is unchanged.</KateCard>;
      break;
    case 'paused':
      card = <KateCard tone="quiet" title="Suggestions are paused">Kate will not make saving suggestions. Your goal and answers are kept.</KateCard>;
      break;
    case 'quiet':
      card = <KateCard tone="quiet" title="Nothing needs your attention">Kate stays quiet until something changes.</KateCard>;
      break;
  }

  return (
    <div className="space-y-3">
      {error ? <Notice tone="error" title={error.code === 'REVISION_CONFLICT' ? 'Your plan changed' : 'Not confirmed'} onClose={clearError}>{error.message} Please review the step below.</Notice> : null}
      {transportError ? <Notice tone="error" title="Nothing was confirmed">{transportError}</Notice> : null}
      {card}
      {sheet === 'evidence' ? <EvidenceSheet onClose={() => setSheet(null)} /> : null}
      {sheet === 'why' ? <WhySheet onClose={() => setSheet(null)} /> : null}
    </div>
  );
}

function EvidenceSheet({ onClose }: { onClose: () => void }) {
  const { snapshot, send, pending } = useSaving();
  if (!snapshot) return null;
  const total = snapshot.subscriptions.reduce((sum, s) => sum + s.monthlyCents, 0);
  const answer = async (merchantId: string, decision: 'unused' | 'keep') => {
    await send({ type: 'REVIEW_SUBSCRIPTION', merchantId, decision });
    if (decision === 'unused') onClose();
  };
  return (
    <Sheet title="Recurring charges" onClose={onClose}>
      <p className="text-sm text-kbc-navy/90">
        {snapshot.subscriptions.length} synthetic streaming charges, {formatCents(total)}/month in total. A recurring payment shows spending, not whether you still use the service. Only you know that.
      </p>
      <ul className="mt-3 space-y-2">
        {snapshot.subscriptions.map(s => {
          const review = snapshot.reviews.find(r => r.merchantId === s.merchantId);
          return (
            <li key={s.merchantId} className="rounded-lg border border-kbc-line p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{s.label}</span>
                <span className="tabular-nums">{formatCents(s.monthlyCents)}/month</span>
              </div>
              <p className="mt-0.5 text-xs text-kbc-muted">Synthetic charges on {evidenceDates(s.evidenceIds).map(formatDate).join(', ')}</p>
              {review ? <p className="mt-2 text-sm font-medium text-kbc-ok">You said: {review.decision === 'keep' ? 'keep it' : 'no longer used'}</p> : (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="chip" disabled={!!pending} onClick={() => void answer(s.merchantId, 'unused')}>I no longer use this</Button>
                  <Button variant="text" disabled={!!pending} onClick={() => void answer(s.merchantId, 'keep')}>Keep</Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <Button variant="secondary" className="mt-4 w-full" onClick={onClose}>Done</Button>
    </Sheet>
  );
}

function WhySheet({ onClose }: { onClose: () => void }) {
  const { snapshot } = useSaving();
  if (!snapshot) return null;
  const { goal, baseline, projected } = snapshot;
  const total = snapshot.subscriptions.reduce((sum, s) => sum + s.monthlyCents, 0);
  return (
    <Sheet title="Why this?" onClose={onClose}>
      <ul className="space-y-2 text-sm">
        <li className="flex gap-2"><Icon name="plane" className="h-4 w-4 shrink-0 text-kbc-sky-dark" />
          You set a goal: {formatCents(goal.targetCents)} for {goal.title} by {formatDate(goal.deadline)}.</li>
        <li className="flex gap-2"><Icon name="chart" className="h-4 w-4 shrink-0 text-kbc-sky-dark" />
          With {formatCents(goal.monthlyContributionCents)} a month from {formatDate(goal.firstContributionDate)}, the projected finish is {baseline.completionDate ? formatMonth(baseline.completionDate) : 'not reachable'}{baseline.onTrack ? '.' : ', after your deadline.'}</li>
        <li className="flex gap-2"><Icon name="card" className="h-4 w-4 shrink-0 text-kbc-sky-dark" />
          {snapshot.subscriptions.length} recurring streaming charges ({formatCents(total)}/month) appear in your synthetic transactions: three equal charges about a month apart.</li>
      </ul>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-kbc-sky-dark">Projection assumptions</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-kbc-navy/90">
        {projected.assumptions.map(a => <li key={a}>{a}</li>)}
      </ul>
      <p className="mt-3 rounded-lg bg-kbc-kate p-3 text-xs text-kbc-navy/90">
        Kate does not know whether you use a service, whether services overlap or what alternatives cost. She only asks. Nothing is cancelled and no provider is contacted.
      </p>
    </Sheet>
  );
}
