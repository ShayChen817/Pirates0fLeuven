'use client';

import { useId, useState, type FormEvent } from 'react';
import type { Action, Snapshot } from '@/lib/types';
import { useMoments } from '@/components/session/MomentsProvider';
import { formatCents, formatDate } from '@/components/format';
import { Badge, Button, KateCard, Notice, Row, Sheet } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { describeSignal, kindLabel } from './copy';

type SheetId = 'moving' | 'long-term' | 'reserve' | 'simulation' | 'why' | 'other' | null;

/** Home and Kate both render this for the one primary action, so they can never disagree. */
export function PrimaryActionCard() {
  const { snapshot, primary, pending, error, transportError, clearError, send } = useMoments();
  const [sheet, setSheet] = useState<SheetId>(null);
  if (!snapshot) return <LoadingCard />;

  const busy = !!pending;
  const feedback = (
    <>
      {error ? (
        <Notice tone="error" title={error.code === 'REVISION_CONFLICT' ? 'Your plan changed' : 'Not confirmed'} onClose={clearError}>
          {error.message} Please review the step below.
        </Notice>
      ) : null}
      {transportError ? <Notice tone="error" title="Nothing was confirmed">{transportError}</Notice> : null}
    </>
  );

  if (!primary) {
    return (
      <div className="space-y-3">
        {feedback}
        <KateCard quiet title={snapshot.context.proactiveEnabled ? 'Nothing needs your attention' : 'Suggestions are paused'}>
          {snapshot.context.proactiveEnabled
            ? 'Kate stays quiet until something changes. Your answers are kept for this session.'
            : 'Kate will not make proactive suggestions. Everything else keeps working.'}
        </KateCard>
      </div>
    );
  }

  const secondary = (
    <div className="flex w-full items-center justify-between pt-1">
      <Button variant="text" className="-ml-2" onClick={() => setSheet('why')}>Why this?</Button>
      <Button variant="text" className="!text-ink-3 hover:!text-ink" disabled={busy}
        busy={pending === 'DISMISS_ACTION'} onClick={() => void send({ type: 'DISMISS_ACTION', actionId: primary.id })}>Not now</Button>
    </div>
  );
  let actions;
  switch (primary.ruleId) {
    case 'clarify-intent':
      actions = (<>
        <Button variant="chip" disabled={busy} onClick={() => setSheet('moving')}>I&apos;m moving</Button>
        <Button variant="chip" disabled={busy} onClick={() => setSheet('long-term')}>No upcoming plans</Button>
        <Button variant="chip" disabled={busy} onClick={() => setSheet('other')}>Something else</Button>
      </>);
      break;
    case 'moving-reserve':
      actions = <Button className="w-full" disabled={busy} onClick={() => setSheet('reserve')}>{primary.cta}</Button>;
      break;
    case 'coverage-check':
      actions = (<>
        <Button variant="chip" busy={pending === 'REPORT_COVERAGE'} disabled={busy}
          onClick={() => void send({ type: 'REPORT_COVERAGE', coverage: 'confirmed-covered' })}>Already insured elsewhere</Button>
        <Button variant="chip" disabled={busy}
          onClick={() => void send({ type: 'REPORT_COVERAGE', coverage: 'confirmed-need' })}>I need cover</Button>
      </>);
      break;
    case 'explore-investment':
      actions = <Button className="w-full" disabled={busy} onClick={() => setSheet('simulation')}>{primary.cta}</Button>;
      break;
  }

  return (
    <div className="space-y-3">
      {feedback}
      <KateCard title={primary.title} actions={<>{actions}{secondary}</>}>
        {primary.message}
      </KateCard>

      {sheet === 'moving' ? <MovingSheet onClose={() => setSheet(null)} /> : null}
      {sheet === 'long-term' ? <LongTermSheet onClose={() => setSheet(null)} /> : null}
      {sheet === 'reserve' ? <ReserveSheet action={primary} snapshot={snapshot} onClose={() => setSheet(null)} /> : null}
      {sheet === 'simulation' ? <SimulationSheet action={primary} snapshot={snapshot} onClose={() => setSheet(null)} /> : null}
      {sheet === 'why' ? <WhySheet action={primary} snapshot={snapshot} onClose={() => setSheet(null)} /> : null}
      {sheet === 'other' ? (
        <Sheet title="Something else" onClose={() => setSheet(null)}>
          <p className="text-sm text-ink-2">Other plans are not part of this prototype yet. In the full vision, Kate would ask a short structured question here instead of guessing.</p>
          <Button className="mt-4 w-full" variant="secondary" onClick={() => setSheet(null)}>Back</Button>
        </Sheet>
      ) : null}
    </div>
  );
}

function LoadingCard() {
  return (
    <div role="status" className="animate-pulse rounded-lg border-l-4 border-kbc-sky bg-tint p-4">
      <div className="h-3 w-24 rounded bg-kbc-sky/30" />
      <div className="mt-3 h-4 w-3/4 rounded bg-kbc-sky/30" />
      <div className="mt-2 h-3 w-full rounded bg-kbc-sky/20" />
      <span className="sr-only">Loading your overview</span>
    </div>
  );
}

function useSubmit(onClose: () => void) {
  const { send, pending, error, transportError } = useMoments();
  const submit = async (event: Parameters<typeof send>[0]) => {
    if (await send(event)) onClose();
  };
  const feedback = error || transportError ? <Notice tone="error" title="Not confirmed">{error?.message ?? transportError}</Notice> : null;
  return { submit, pending, feedback };
}

function MovingSheet({ onClose }: { onClose: () => void }) {
  const { submit, pending, feedback } = useSubmit(onClose);
  const [amount, setAmount] = useState('2500');
  const [date, setDate] = useState('2026-11-01');
  const [problem, setProblem] = useState<string | null>(null);
  const ids = { amount: useId(), date: useId(), err: useId() };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const euros = Number(amount);
    if (!Number.isInteger(euros) || euros <= 0) return setProblem('Enter a whole amount in euros, above zero.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date <= '2026-10-01') return setProblem('Choose a date after 1 October 2026.');
    setProblem(null);
    void submit({ type: 'CONFIRM_MOVING', commitment: { id: 'moving-2026-10', amountCents: euros * 100, dueDate: date, purpose: 'moving' } });
  };

  return (
    <Sheet title="Tell Kate about your move" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {feedback}
        <p className="text-sm text-ink-2">Only the costs still to pay. Payments you already made are in your balance and are not counted twice.</p>
        <div>
          <label htmlFor={ids.amount} className="block text-sm font-semibold text-ink-2">Remaining moving cost (€)</label>
          <input id={ids.amount} inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ''))}
            aria-invalid={!!problem} aria-describedby={problem ? ids.err : undefined}
            className="mt-1.5 h-12 w-full rounded-[var(--radius-field)] bg-canvas px-4 text-[17px] font-semibold tabular-nums text-ink ring-1 ring-line transition-shadow focus:outline-none focus:ring-2 focus:ring-kbc-blue" />
        </div>
        <div>
          <label htmlFor={ids.date} className="block text-sm font-semibold text-ink-2">Moving date</label>
          <input id={ids.date} type="date" value={date} min="2026-10-02" onChange={e => setDate(e.target.value)}
            aria-invalid={!!problem} aria-describedby={problem ? ids.err : undefined}
            className="mt-1.5 h-12 w-full rounded-[var(--radius-field)] bg-canvas px-4 text-[17px] font-semibold text-ink ring-1 ring-line transition-shadow focus:outline-none focus:ring-2 focus:ring-kbc-blue" />
        </div>
        {problem ? <p id={ids.err} role="alert" className="text-sm font-medium text-error">{problem}</p> : null}
        <Button type="submit" className="w-full" busy={pending === 'CONFIRM_MOVING'}>Confirm my move</Button>
        <p className="text-center text-xs text-ink-3">No money moves. Kate only updates your plan.</p>
      </form>
    </Sheet>
  );
}

function LongTermSheet({ onClose }: { onClose: () => void }) {
  const { submit, pending, feedback } = useSubmit(onClose);
  const [years, setYears] = useState('7');
  const [noCommitments, setNoCommitments] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const ids = { years: useId(), check: useId(), err: useId() };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(years);
    if (!Number.isInteger(n) || n <= 0 || n > 50) return setProblem('Enter a number of years between 1 and 50.');
    if (!noCommitments) return setProblem('Please confirm that no other large expenses are coming up.');
    setProblem(null);
    void submit({ type: 'CONFIRM_LONG_TERM', horizonYears: n, noAdditionalCommitments: true });
  };

  return (
    <Sheet title="A long-term goal" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {feedback}
        <div>
          <label htmlFor={ids.years} className="block text-sm font-semibold text-ink-2">How many years can this money stay put?</label>
          <input id={ids.years} inputMode="numeric" value={years} onChange={e => setYears(e.target.value.replace(/[^\d]/g, ''))}
            aria-invalid={!!problem} aria-describedby={problem ? ids.err : undefined}
            className="mt-1.5 h-12 w-full rounded-[var(--radius-field)] bg-canvas px-4 text-[17px] font-semibold tabular-nums text-ink ring-1 ring-line transition-shadow focus:outline-none focus:ring-2 focus:ring-kbc-blue" />
        </div>
        <label htmlFor={ids.check} className="flex items-start gap-3 text-sm">
          <input id={ids.check} type="checkbox" checked={noCommitments} onChange={e => setNoCommitments(e.target.checked)}
            className="mt-0.5 h-5 w-5 accent-[#0d2a50]" />
          <span>I have no other large expenses coming up.</span>
        </label>
        {problem ? <p id={ids.err} role="alert" className="text-sm font-medium text-error">{problem}</p> : null}
        <Button type="submit" className="w-full" busy={pending === 'CONFIRM_LONG_TERM'}>Confirm my goal</Button>
      </form>
    </Sheet>
  );
}

function MoneyRows({ snapshot }: { snapshot: Snapshot }) {
  const { context } = snapshot;
  return (
    <dl>
      <Row label="Accessible cash" value={formatCents(context.accessibleCashCents)} />
      <Row label="Emergency reserve" value={`− ${formatCents(context.reserveCents)}`} />
      <Row label="Upcoming expenses" value={`− ${formatCents(context.expensesCents)}`} />
      {context.commitments.map(c => (
        <Row key={c.id} label={c.purpose === 'moving' ? `Moving (${formatDate(c.dueDate)})` : 'Other commitment'} value={`− ${formatCents(c.amountCents)}`} />
      ))}
      <Row strong label="Potentially available" value={formatCents(snapshot.availableCashCents)} />
    </dl>
  );
}

export { MoneyRows };

function ReserveSheet({ action, snapshot, onClose }: { action: Action; snapshot: Snapshot; onClose: () => void }) {
  const { submit, pending, feedback } = useSubmit(onClose);
  return (
    <Sheet title="Your moving reserve" onClose={onClose}>
      {feedback}
      <MoneyRows snapshot={snapshot} />
      <ul className="mt-3 space-y-1.5 text-sm">
        <li className="flex gap-2"><Icon name="check" className="h-4 w-4 text-kbc-green-ink" /> {formatCents(action.amountCents ?? 0)} stays in your calculation for the move.</li>
        <li className="flex gap-2"><Icon name="check" className="h-4 w-4 text-kbc-green-ink" /> Investing is not suggested while the move is coming up.</li>
        <li className="flex gap-2"><Icon name="info" className="h-4 w-4 text-kbc-blue-ink" /> No money moves. This is a plan, not a transfer.</li>
      </ul>
      <Button className="mt-4 w-full" busy={pending === 'ACKNOWLEDGE_RESERVE'}
        onClick={() => void submit({ type: 'ACKNOWLEDGE_RESERVE', actionId: action.id })}>{action.cta}</Button>
    </Sheet>
  );
}

const profiles = [
  { id: 'lower', label: 'Lower risk', note: 'Smaller ups and downs. Lower risk is not risk-free.', match: 'defensive' },
  { id: 'balanced', label: 'Balanced', note: 'A mix of steadier and growth-oriented parts.', match: 'neutral' },
  { id: 'growth', label: 'Growth', note: 'Bigger ups and downs over a long horizon.', match: 'dynamic' },
] as const;

function SimulationSheet({ action, snapshot, onClose }: { action: Action; snapshot: Snapshot; onClose: () => void }) {
  const { submit, pending, feedback } = useSubmit(onClose);
  const suggested = action.amountCents ?? 0;
  const max = snapshot.availableCashCents;
  const [amount, setAmount] = useState(suggested);
  const profileMatch = profiles.find(p => p.match === snapshot.context.riskProfile)?.id ?? 'balanced';
  const [profile, setProfile] = useState<string>(profileMatch);
  const sliderId = useId();

  return (
    <Sheet title="Long-term simulation" onClose={onClose}>
      {feedback}
      <Badge tone="warn">Simulation · no money moves</Badge>
      <div className="mt-3">
        <label htmlFor={sliderId} className="flex items-baseline justify-between text-sm font-medium">
          <span>Amount to simulate</span>
          <span className="text-2xl font-bold tabular-nums">{formatCents(amount)}</span>
        </label>
        <input id={sliderId} type="range" min={10000} max={max} step={5000} value={amount}
          onChange={e => setAmount(Number(e.target.value))} className="mt-2 w-full accent-[#0d2a50]"
          aria-valuetext={formatCents(amount)} />
        <p className="text-xs text-ink-3">Kate suggested {formatCents(suggested)}. {formatCents(max - amount)} of the potentially available {formatCents(max)} stays flexible.</p>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Illustrative profile</legend>
        <div className="mt-2 grid gap-2">
          {profiles.map(p => (
            <label key={p.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${profile === p.id ? 'border-kbc-navy bg-tint' : 'border-line bg-white'}`}>
              <input type="radio" name="profile" value={p.id} checked={profile === p.id} onChange={() => setProfile(p.id)} className="mt-1 accent-[#0d2a50]" />
              <span className="text-sm">
                <span className="flex items-center gap-2 font-semibold">{p.label}{p.id === profileMatch ? <Badge tone="ok">Closest to your synthetic profile</Badge> : null}</span>
                <span className="text-ink-3">{p.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <ul className="mt-4 space-y-1.5 text-sm">
        <li className="flex gap-2"><Icon name="check" className="h-4 w-4 text-kbc-green-ink" /> Emergency reserve of {formatCents(snapshot.context.reserveCents)} kept aside</li>
        <li className="flex gap-2"><Icon name="check" className="h-4 w-4 text-kbc-green-ink" /> Upcoming expenses of {formatCents(snapshot.context.expensesCents)} kept aside</li>
        <li className="flex gap-2"><Icon name="info" className="h-4 w-4 text-kbc-blue-ink" /> Illustrative only. No returns are promised and this is not a suitability assessment.</li>
      </ul>
      <Button className="mt-4 w-full" busy={pending === 'CONFIRM_SIMULATION'}
        onClick={() => void submit({ type: 'CONFIRM_SIMULATION', actionId: action.id, amountCents: amount })}>
        Confirm simulation
      </Button>
    </Sheet>
  );
}

function WhySheet({ action, snapshot, onClose }: { action: Action; snapshot: Snapshot; onClose: () => void }) {
  const evidence = snapshot.context.signals.filter(s => action.evidenceIds.includes(s.id));
  return (
    <Sheet title="Why this suggestion?" onClose={onClose}>
      <p className="text-sm text-ink-2">Kate used only these facts. You can correct them in <strong>Profile → Data &amp; your answers</strong>.</p>
      <ul className="mt-3 space-y-2">
        {evidence.map(s => {
          const d = describeSignal(s);
          return (
            <li key={s.id} className="rounded-lg bg-tint p-3 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{d.label}</span><span className="tabular-nums">{d.value}</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-3">{kindLabel[s.kind]} · {s.source} · valid until {formatDate(s.validUntil)}</p>
            </li>
          );
        })}
      </ul>
      {action.ruleId !== 'coverage-check' ? <div className="mt-3"><MoneyRows snapshot={snapshot} /></div> : null}
    </Sheet>
  );
}
