'use client';
import { useState } from 'react';
import { useSavingInsights } from '@/components/session/SavingInsightsProvider';
import { useSaving } from '@/components/session/SavingProvider';
import { formatCents } from '@/components/format';
import { Badge, Button, Card, Notice, ProgressBar, Sheet } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';

/** Service-owned buffer state and calculations; this component owns only sheet visibility. */
export function InvestTip() {
  const { snapshot, send, pending, error, transportError } = useSavingInsights();
  const { snapshot: saving } = useSaving();
  const [open, setOpen] = useState(false);
  if (!snapshot || !saving) return null;
  const { bufferFunded, emergencyFundCents, bufferTargetCents, bufferGapCents } = snapshot;
  const enabled = saving.proactiveEnabled && !(saving.snoozedUntil && Date.parse(saving.snoozedUntil) > Date.parse(saving.asOf));
  const illustration = snapshot.illustration;
  return <>
    <Card aria-label="Emergency buffer">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Icon name="shield" className="h-4 w-4 text-kbc-blue" />Your safety net</h3>
        <Badge tone={bufferFunded ? 'ok' : 'tint'}>{bufferFunded ? 'Target reached' : 'Building'}</Badge>
      </div>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-ink-3"><strong className="text-[26px] font-semibold tabular-nums text-ink">{formatCents(emergencyFundCents)}</strong><span className="text-sm">of {formatCents(bufferTargetCents)}</span></p>
      <div className="mt-3"><ProgressBar value={emergencyFundCents} max={bufferTargetCents} label="Demo emergency buffer" tone={bufferFunded ? 'green' : 'blue'} /></div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{bufferFunded ? 'This demo buffer target is met. Your near-term goal remains separate.' : `${formatCents(bufferGapCents)} to this demo target. Long-term investing examples stay hidden while the buffer is being built.`}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-3">Synthetic balance and target. The right buffer depends on your circumstances; reaching this target does not establish investment suitability.</p>
      {bufferFunded && enabled ? <Button variant="text" className="mt-2 !h-auto text-left" busy={!!pending} onClick={async () => { if (await send({ type: 'REQUEST_LONG_TERM_EXAMPLE' })) setOpen(true); }}>Explore a separate 10-year example <Icon name="chevron" className="h-4 w-4 shrink-0" /></Button> : null}
      {error || transportError ? <div className="mt-3"><Notice tone="error" title="Could not open example">{error?.message ?? transportError}</Notice></div> : null}
    </Card>
    {open && illustration && enabled ? <Sheet title="A longer-term perspective" onClose={() => setOpen(false)}>
      <p className="text-sm leading-relaxed text-ink-2">Imagine a separate {formatCents(illustration.monthlyCents)}/month for {illustration.years} years. This example uses none of your Japan savings or subscription plan.</p>
      <p className="mt-3 rounded-xl bg-tint px-4 py-3 text-sm text-ink">Total paid in <strong className="float-right tabular-nums">{formatCents(illustration.contributedCents)}</strong></p>
      <table className="mt-4 w-full text-left text-sm">
        <caption className="mb-3 text-left text-xs leading-relaxed text-ink-3">Hypothetical constant annual returns · not market forecasts or named investment products.</caption>
        <thead><tr className="text-xs text-ink-3"><th scope="col" className="pb-2 font-medium">Assumption / year</th><th scope="col" className="pb-2 text-right font-medium">After 10 years</th></tr></thead>
        <tbody>{illustration.scenarios.map(row => <tr key={row.label} className="border-t border-line"><th scope="row" className="py-3 pr-3 font-normal"><span className="block">{row.label}</span><span className="text-xs text-ink-3">{row.annualRatePercent > 0 ? '+' : ''}{row.annualRatePercent}%</span></th><td className="py-3 text-right font-semibold tabular-nums">{formatCents(row.valueCents)}</td></tr>)}</tbody>
      </table>
      <p className="mt-3 text-xs leading-relaxed text-ink-2">Capital can fall below what you contribute. Constant rates are simplified assumptions, not predictions. Contributions occur at month-end; fees, taxes, inflation and market volatility are excluded. This educational example makes no allocation or transaction.</p>
      <Button className="mt-5 w-full" variant="secondary" onClick={() => setOpen(false)}>Back to my goal</Button>
    </Sheet> : null}
  </>;
}
