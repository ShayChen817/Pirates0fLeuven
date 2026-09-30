'use client';

import { useState } from 'react';
import { useSaving } from '@/components/session/SavingProvider';
import { projectGoal } from '@/lib/saving';
import { formatCents, formatDate, formatMonth } from '@/components/format';
import { Button, KateCard, Notice, Sheet } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { evidenceDates, savingView, subscriptionById } from './view';

const monthName = (iso: string | null) => (iso ? formatMonth(iso).split(' ')[0] : '—');

/** The one Kate advice card for Saving. Home and the Kate tab render the same service state. */
export function SavingKateCard() {
  const { snapshot, send, pending, error, transportError, clearError } = useSaving();
  const [sheet, setSheet] = useState<'evidence' | 'why' | null>(null);
  if (!snapshot) {
    return <div role="status" className="h-32 animate-pulse rounded-lg bg-tint" aria-label="Loading" />;
  }
  const busy = !!pending;
  const view = savingView(snapshot);
  const secondary = (withNotNow: boolean) => (
    <div className="flex w-full items-center justify-between pt-1">
      <Button variant="text" className="-ml-2" onClick={() => setSheet('why')}>Why this?</Button>
      {withNotNow ? (
        <Button variant="text" className="!text-ink-3 hover:!text-ink" disabled={busy} busy={pending === 'SNOOZE_ADVICE'}
          onClick={() => void send({ type: 'SNOOZE_ADVICE' })}>Not now</Button>
      ) : null}
    </div>
  );

  let card;
  switch (view) {
    case 'review':
      card = (
        <KateCard title="A small review for your goal" actions={<>
          <Button className="w-full" disabled={busy} onClick={() => setSheet('evidence')}>Review the charges</Button>{secondary(true)}
        </>}>{snapshot.primary!.message}</KateCard>
      );
      break;
    case 'intention': {
      const sub = subscriptionById(snapshot, snapshot.primary!.merchantId)!;
      // Preview with the backend's own projection function; nothing is recorded until "Add to my plan".
      const revised = projectGoal(snapshot.goal, sub.monthlyCents);
      const baseline = snapshot.baseline;
      card = (
        <KateCard title={`Put ${formatCents(sub.monthlyCents)}/month towards ${snapshot.goal.title}?`} actions={<>
          <Button className="flex-1" busy={pending === 'ADD_SAVING_INTENTION'} disabled={busy}
            onClick={() => void send({ type: 'ADD_SAVING_INTENTION', merchantId: sub.merchantId })}>Add to my plan</Button>
          <Button variant="secondary" disabled={busy} busy={pending === 'REVIEW_SUBSCRIPTION'}
            onClick={() => void send({ type: 'REVIEW_SUBSCRIPTION', merchantId: sub.merchantId, decision: 'keep' })}>Keep it</Button>
          {secondary(true)}
        </>}>
          <p>If you stop {sub.label} and redirect that money, your projected finish moves from {monthName(baseline.completionDate)} to {monthName(revised.completionDate)}.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 border-y border-line py-3">
            <div>
              <p className="text-xs text-ink-3">Per month</p>
              <p className="mt-0.5 tabular-nums"><s className="text-ink-3">{formatCents(baseline.monthlyCents)}</s> <strong className="text-lg text-ink">{formatCents(revised.monthlyCents)}</strong></p>
            </div>
            <div>
              <p className="text-xs text-ink-3">Projected finish</p>
              <p className="mt-0.5"><s className="text-ink-3">{monthName(baseline.completionDate).slice(0, 3)}</s> <strong className="text-lg text-kbc-green-ink">{revised.completionDate ? formatMonth(revised.completionDate) : '—'}</strong></p>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-3">A projection: the charge stops, contributions continue, no interest.</p>
        </KateCard>
      );
      break;
    }
    case 'planned': {
      const intention = snapshot.intentions[0];
      const sub = subscriptionById(snapshot, intention.merchantId);
      card = (
        <KateCard quiet title="Planned; subscription not cancelled." actions={<>
          <Button variant="chip" disabled={busy} busy={pending === 'REMOVE_SAVING_INTENTION'}
            onClick={() => void send({ type: 'REMOVE_SAVING_INTENTION', merchantId: intention.merchantId })}>Remove from plan</Button>{secondary(false)}
        </>}>
          <p>You plan to put {formatCents(intention.monthlyCents)}/month from {sub?.label ?? 'this service'} towards {snapshot.goal.title}. Cancelling is up to you; Kate contacted no provider.</p>
          <p className="mt-1">Your saved amount stays {formatCents(snapshot.goal.savedCents)} until contributions actually arrive.</p>
        </KateCard>
      );
      break;
    }
    case 'kept':
      card = <KateCard quiet title="Got it, the service stays">No saving is counted and your projection is unchanged. Kate will not push another review right now.</KateCard>;
      break;
    case 'snoozed':
      card = <KateCard quiet title="Okay, not now">Kate stays quiet about this until {formatDate(snapshot.snoozedUntil!)}. Your plan is unchanged.</KateCard>;
      break;
    case 'paused':
      card = <KateCard quiet title="Suggestions are paused">Kate will not make saving suggestions. Your goal and answers are kept.</KateCard>;
      break;
    case 'quiet':
      card = <KateCard quiet title="Nothing needs your attention">Kate stays quiet until something changes.</KateCard>;
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
      <p className="text-sm text-ink-2">
        {snapshot.subscriptions.length} synthetic streaming charges, {formatCents(total)}/month in total. A recurring payment shows spending, not whether you still use the service. Only you know that.
      </p>
      <ul className="mt-3 space-y-2">
        {snapshot.subscriptions.map(s => {
          const review = snapshot.reviews.find(r => r.merchantId === s.merchantId);
          return (
            <li key={s.merchantId} className="rounded-lg border border-line p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{s.label}</span>
                <span className="tabular-nums">{formatCents(s.monthlyCents)}/month</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-3">Synthetic charges on {evidenceDates(s.evidenceIds).map(formatDate).join(', ')}</p>
              {review ? <p className="mt-2 text-sm font-medium text-kbc-green-ink">You said: {review.decision === 'keep' ? 'keep it' : 'no longer used'}</p> : (
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
        <li className="flex gap-2"><Icon name="plane" className="h-4 w-4 shrink-0 text-kbc-blue-ink" />
          You set a goal: {formatCents(goal.targetCents)} for {goal.title} by {formatDate(goal.deadline)}.</li>
        <li className="flex gap-2"><Icon name="chart" className="h-4 w-4 shrink-0 text-kbc-blue-ink" />
          With {formatCents(goal.monthlyContributionCents)} a month from {formatDate(goal.firstContributionDate)}, the projected finish is {baseline.completionDate ? formatMonth(baseline.completionDate) : 'not reachable'}{baseline.onTrack ? '.' : ', after your deadline.'}</li>
        <li className="flex gap-2"><Icon name="card" className="h-4 w-4 shrink-0 text-kbc-blue-ink" />
          {snapshot.subscriptions.length} recurring streaming charges ({formatCents(total)}/month) appear in your synthetic transactions: three equal charges about a month apart.</li>
      </ul>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-kbc-blue-ink">Projection assumptions</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-ink-2">
        {projected.assumptions.map(a => <li key={a}>{a}</li>)}
      </ul>
      <p className="mt-3 rounded-lg bg-tint p-3 text-xs text-ink-2">
        Kate does not know whether you use a service, whether services overlap or what alternatives cost. She only asks. Nothing is cancelled and no provider is contacted.
      </p>
    </Sheet>
  );
}
