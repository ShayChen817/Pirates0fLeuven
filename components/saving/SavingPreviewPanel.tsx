'use client';

// DEMO: Saving concept preview — not connected to the engine.
import { useSaving } from '@/components/session/SavingProvider';
import { formatCents, formatDate } from '@/components/format';
import { Badge, Card, Row } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { plannedMonthlyCents, project, savingScenario } from '@/components/demo/savingPreview';

export function SavingPreviewPanel() {
  const { state } = useSaving();
  const { goal } = savingScenario;
  const gap = goal.targetCents - goal.savedCents;
  const p = project(plannedMonthlyCents(state));
  return (
    <Card aria-label="Saving preview details" className="!p-0 overflow-hidden">
      <div className="flex items-center gap-2 bg-kbc-navy px-4 py-3 text-white">
        <Icon name="engine" />
        <div>
          <h2 className="text-base font-semibold">Behind the scenes</h2>
          <p className="text-xs text-white/80">Saving concept preview</p>
        </div>
      </div>
      <div className="space-y-3 p-4 text-sm">
        <Badge tone="warn">Concept preview — not connected to the engine</Badge>
        <p className="text-kbc-navy/90">The Saving contract is not agreed yet. This local preview uses fixed synthetic values; the decision engine will replace it.</p>
        <dl>
          <Row label="Preview state" value={state.status} />
          <Row label="Remaining gap" value={formatCents(gap)} />
          <Row label="Planned per month" value={formatCents(p.monthlyCents)} />
          <Row label={`ceil(${formatCents(gap)} ÷ ${formatCents(p.monthlyCents)})`} value={`${p.contributions} contributions`} />
          <Row strong label="Projected finish" value={formatDate(p.completionDate)} />
          <Row muted label="Actual saved (unchanged by plans)" value={formatCents(goal.savedCents)} />
        </dl>
        <p className="text-xs text-kbc-muted">Zero interest, uninterrupted contributions on the first of each month. A plan never increases the saved amount; no investment is used for this near-term goal.</p>
      </div>
    </Card>
  );
}
