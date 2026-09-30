'use client';
import { useState, type ReactNode } from 'react';
import { useProfile } from '@/components/session/ProfileProvider';
import { useSaving } from '@/components/session/SavingProvider';
import { useMoments } from '@/components/session/MomentsProvider';
import { PREFERENCE_LABELS, type Preference } from '@/lib/profile';
import { Button, Notice, Sheet } from '@/components/ui/primitives';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SavingKnows } from '@/components/saving/SavingKnows';
import { MovingKnows } from '@/components/moving/MovingKnows';
import { formatCents, formatMonth } from '@/components/format';

function SettingRow({ icon, title, detail, onClick }: { icon: IconName; title: string; detail: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="setting-row">
    <span className="setting-icon"><Icon name={icon} /></span>
    <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{title}</span><span className="mt-0.5 block text-[13px] leading-snug text-ink-3">{detail}</span></span>
    <Icon name="chevron" className="h-4 w-4 shrink-0 text-ink-3" />
  </button>;
}

export function ProfileScreen({ scenario }: { scenario: 'saving' | 'moving' }) {
  const profile = useProfile();
  const saving = useSaving();
  const moving = useMoments();
  const [sheet, setSheet] = useState<'bio' | 'preferences' | 'goal' | 'data' | null>(null);
  const state = profile.snapshot;
  if (!state) return <div className="page-pad" role="status">Loading your profile…</div>;
  const enabled = scenario === 'saving' ? saving.snapshot?.proactiveEnabled : moving.snapshot?.context.proactiveEnabled;
  const pending = scenario === 'saving' ? saving.pending : moving.pending;
  const toggle = () => scenario === 'saving'
    ? saving.send({ type: 'SET_PROACTIVE', enabled: !enabled })
    : moving.send({ type: 'SET_PROACTIVE', enabled: !enabled });
  const activeError = scenario === 'saving' ? saving.error?.message ?? saving.transportError : moving.error?.message ?? moving.transportError;
  return <div className="profile-page page-pad">
    <header className="page-heading"><p className="eyebrow">Made personal</p><h2>Your profile</h2><p>You tell Kate. You stay in control.</p></header>
    <div className="profile-identity"><div className="profile-monogram" aria-hidden="true">S<span /></div><div><h3>Shay</h3><p>Your goals. Your pace.</p></div><span className="session-dot" title="Synthetic demo session" /></div>
    {activeError ? <Notice tone="error" title="Could not update">{activeError}</Notice> : null}
    <section className="profile-intro">
      <div className="flex items-center justify-between"><h3 className="text-[13px] font-semibold text-ink-3">A little about you</h3><button className="text-link" type="button" onClick={() => setSheet('bio')}>{state.bio ? 'Edit' : 'Add'}</button></div>
      <p className="mt-2 line-clamp-3 text-[16px] leading-relaxed">{state.bio || 'What are you working towards? A few words help Kate make it personal.'}</p>
      {state.status === 'review' ? <button type="button" className="mt-3 text-link" onClick={() => setSheet('preferences')}>Review Kate’s understanding <span aria-hidden="true">→</span></button> : null}
    </section>
    <section aria-label="Profile settings" className="settings-group">
      <SettingRow icon="sparkle" title="What matters to you" detail={state.status === 'review' ? 'Your confirmation is needed' : state.confirmed.length ? state.confirmed.map(t => PREFERENCE_LABELS[t]).join(' · ') : 'Choose what Kate can help with'} onClick={() => setSheet('preferences')} />
      {scenario === 'saving' ? <SettingRow icon="plane" title="Your saving goal" detail={saving.snapshot ? `${formatCents(saving.snapshot.goal.targetCents)} · ${formatMonth(saving.snapshot.goal.deadline)}` : 'Loading…'} onClick={() => setSheet('goal')} /> : null}
      <SettingRow icon="shield" title="Data & your answers" detail="See the evidence. Correct your information." onClick={() => setSheet('data')} />
    </section>
    <section className="suggestion-control" aria-label="Suggestions">
      <div><h3 className="text-[14px] font-semibold">Kate suggestions</h3><p className="mt-0.5 text-xs text-ink-3">{enabled ? 'On for this goal' : 'Paused for this goal'}</p></div>
      <button type="button" role="switch" aria-label="Kate suggestions" aria-checked={!!enabled} disabled={!!pending || enabled === undefined} onClick={() => void toggle()} className="switch-control"><span /></button>
    </section>
    <p className="profile-footnote">Synthetic demo · saved for this session only</p>
    {sheet === 'bio' ? <BioEditor onClose={() => setSheet(null)} onSaved={() => setSheet('preferences')} /> : null}
    {sheet === 'preferences' ? <PreferenceEditor onClose={() => setSheet(null)} /> : null}
    {sheet === 'goal' ? <GoalEditor onClose={() => setSheet(null)} /> : null}
    {sheet === 'data' ? <Sheet title="Data & your answers" onClose={() => setSheet(null)}>{scenario === 'saving' ? <SavingKnows /> : <MovingKnows />}</Sheet> : null}
  </div>;
}
function EditorError({ message }: { message?: string | null }) { return message ? <Notice tone="error" title="Not saved">{message}</Notice> : null; }
function BioEditor({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { snapshot, send, pending, error, transportError } = useProfile();
  const [bio, setBio] = useState(snapshot?.bio ?? '');
  return <Sheet title="A little about you" onClose={onClose}>
    <p className="editor-help">Tell Kate what you want help with. You can review everything she understands.</p>
    <form onSubmit={async e => { e.preventDefault(); if (await send({ type: 'SAVE_BIO', bio })) onSaved(); }} className="space-y-4">
      <label className="field-label">Your introduction<textarea className="form-field min-h-36 resize-y" maxLength={800} value={bio} onChange={e => setBio(e.target.value)} placeholder="I'm saving for Japan and want to review my streaming subscriptions." /></label>
      <div className="flex justify-between text-xs text-ink-3"><span>Processed on this device. No model call.</span><span>{bio.length}/800</span></div>
      <button type="button" className="text-link text-left" onClick={() => setBio("I'm saving for Japan. Help me review subscriptions I no longer use.")}>Use the Japan example</button>
      <EditorError message={error?.message ?? transportError} />
      <Button type="submit" className="w-full" busy={!!pending}>Review my preferences</Button>
      {snapshot?.bio ? <Button variant="text" className="w-full" disabled={!!pending} onClick={async () => { if (await send({ type: 'CLEAR_PROFILE' })) onClose(); }}>Clear introduction & preferences</Button> : null}
    </form>
  </Sheet>;
}
function PreferenceEditor({ onClose }: { onClose: () => void }) {
  const { snapshot, send, pending, error, transportError } = useProfile();
  const [selected, setSelected] = useState<Preference[]>(snapshot?.status === 'review' ? snapshot.proposed : snapshot?.confirmed ?? []);
  return <Sheet title={snapshot?.status === 'review' ? 'Did Kate get it right?' : 'What matters to you'} onClose={onClose}>
    <p className="editor-help">{snapshot?.status === 'review' ? 'These are keyword suggestions, not facts. Keep only the preferences that feel right.' : 'Choose what you would like help with. You can change this at any time.'}</p>
    <div className="space-y-2 mb-4">{(Object.keys(PREFERENCE_LABELS) as Preference[]).map(tag => <label key={tag} className="preference-option">
      <input type="checkbox" checked={selected.includes(tag)} onChange={() => setSelected(values => values.includes(tag) ? values.filter(v => v !== tag) : [...values, tag])} />
      <span>{PREFERENCE_LABELS[tag]}</span>
    </label>)}</div>
    <EditorError message={error?.message ?? transportError} />
    <Button className="mt-3 w-full" busy={!!pending} onClick={async () => { if (await send({ type: 'CONFIRM_PREFERENCES', preferences: selected })) onClose(); }}>Save my preferences</Button>
    <p className="mt-3 text-xs leading-relaxed text-ink-3">Coffee is a preference only: this demo has no coffee prices or alternatives. Preferences never change your balance or confirm a financial plan.</p>
  </Sheet>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field-label">{label}{children}</label>; }
function GoalEditor({ onClose }: { onClose: () => void }) {
  const { snapshot, send, pending, error, transportError } = useSaving();
  const [goal] = useState(snapshot?.goal);
  if (!goal) return null;
  return <Sheet title="Your saving goal" onClose={onClose}>
    <p className="editor-help">Adjust your plan. Your recorded savings stay unchanged.</p>
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); const data = new FormData(e.currentTarget); if (await send({ type: 'UPDATE_GOAL', title: String(data.get('title')), targetCents: Math.round(Number(data.get('target')) * 100), monthlyContributionCents: Math.round(Number(data.get('monthly')) * 100), deadline: String(data.get('deadline')), firstContributionDate: String(data.get('first')) })) onClose(); }}>
      <Field label="Goal name"><input className="form-field" name="title" defaultValue={goal.title} maxLength={80} required /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Target (€)"><input className="form-field" name="target" type="number" min="1" step="0.01" defaultValue={goal.targetCents / 100} required /></Field><Field label="Per month (€)"><input className="form-field" name="monthly" type="number" min="0" step="0.01" defaultValue={goal.monthlyContributionCents / 100} required /></Field></div>
      <Field label="Target date"><input className="form-field" name="deadline" type="date" min="2026-10-02" defaultValue={goal.deadline} required /></Field>
      <Field label="First contribution"><input className="form-field" name="first" type="date" min="2026-10-02" defaultValue={goal.firstContributionDate} required /></Field>
      <EditorError message={error?.message ?? transportError} />
      <Button className="w-full" type="submit" busy={!!pending}>Update my plan</Button>
    </form>
  </Sheet>;
}
