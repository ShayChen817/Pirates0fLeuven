'use client';
import { useSaving } from '@/components/session/SavingProvider';
import { formatCents, formatDate } from '@/components/format';
import { Row } from '@/components/ui/primitives';

export function SavingKnows() {
  const { snapshot } = useSaving();
  if (!snapshot) return <p role="status">Loading…</p>;
  return <div className="space-y-6">
    <p className="editor-help">Your confirmed plan and the synthetic evidence behind it.</p>
    <section><h3 className="section-label">Your plan · you told Kate</h3><dl>
      <Row label="Goal" value={snapshot.goal.title} />
      <Row label="Target" value={formatCents(snapshot.goal.targetCents)} />
      <Row label="Deadline" value={formatDate(snapshot.goal.deadline)} />
      <Row label="Monthly contribution" value={formatCents(snapshot.goal.monthlyContributionCents)} />
      <Row label="Actually saved" value={formatCents(snapshot.goal.savedCents)} />
    </dl></section>
    <section><h3 className="section-label">Recurring payments · observed</h3><div className="divide-y divide-line">
      {snapshot.subscriptions.map(s => <details key={s.merchantId} className="evidence-row">
        <summary><span>{s.label}</span><strong>{formatCents(s.monthlyCents)}<span className="font-normal text-ink-3"> /mo</span></strong></summary>
        <p>{s.evidenceIds.length} equal monthly charges in synthetic history. This does not establish whether you use the service.</p>
        <p>{snapshot.reviews.find(r => r.merchantId === s.merchantId)?.decision === 'keep' ? 'You chose to keep this service.' : snapshot.reviews.find(r => r.merchantId === s.merchantId)?.decision === 'unused' ? 'You said you no longer use this service.' : 'You have not reviewed this service yet.'}</p>
        {snapshot.intentions.some(i => i.merchantId === s.merchantId) ? <p>Added to your saving plan. Subscription not cancelled.</p> : null}
      </details>)}
    </div></section>
    <p className="text-xs leading-relaxed text-ink-3">Historical payments are already reflected in the demo. No provider is contacted and no real funds are moved.</p>
  </div>;
}
