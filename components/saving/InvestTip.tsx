'use client';

import { formatCents } from '@/components/format';
import { Card, ProgressBar } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';

interface IndexRow { id: string; label: string; ratePct: number }

/** Future value of a monthly contribution (ordinary annuity), integer cents in and out. */
function projectMonthly(monthlyCents: number, ratePct: number, years: number): number {
  const n = years * 12;
  const i = ratePct / 100 / 12;
  const factor = i === 0 ? n : ((1 + i) ** n - 1) / i;
  return Math.round(monthlyCents * factor);
}

/**
 * Emergency-fund-gated investing tip.
 * Below the threshold: Kate actively coaches building the buffer and shows NO returns.
 * Above the threshold: an illustrative, clearly-disclaimed long-term returns table.
 * All figures are synthetic/illustrative; the engine and money decisions are untouched.
 */
export function InvestTip({
  emergencyFundCents,
  thresholdCents,
  monthlyCents,
  horizonYears,
  indexes,
}: {
  emergencyFundCents: number;
  thresholdCents: number;
  monthlyCents: number;
  horizonYears: number;
  indexes: ReadonlyArray<IndexRow>;
}) {
  if (emergencyFundCents < thresholdCents) {
    const remaining = thresholdCents - emergencyFundCents;
    return (
      <Card aria-label="Emergency fund first" className="border-kbc-sky/40">
        <div className="flex items-center gap-2 text-kbc-sky-dark">
          <Icon name="shield" />
          <span className="text-xs font-semibold uppercase tracking-wide">Safety net first</span>
        </div>
        <h3 className="mt-1 text-base font-semibold text-kbc-navy">Let&apos;s build your emergency fund before investing</h3>
        <p className="mt-1 text-sm text-kbc-navy/90">
          A good first step is roughly {formatCents(thresholdCents)} set aside for the unexpected — about 3 months of essentials.
          Kate keeps investing ideas out of the way until you&apos;re there, so nothing is pushed too early.
        </p>
        <div className="mt-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Emergency fund</span>
            <span className="tabular-nums"><strong>{formatCents(emergencyFundCents)}</strong> <span className="text-kbc-muted">of {formatCents(thresholdCents)}</span></span>
          </div>
          <div className="mt-2"><ProgressBar value={emergencyFundCents} max={thresholdCents} label={`Emergency fund: ${formatCents(emergencyFundCents)} of ${formatCents(thresholdCents)}`} /></div>
          <p className="mt-1 text-xs text-kbc-muted">{formatCents(remaining)} to go before investing suggestions appear.</p>
        </div>
      </Card>
    );
  }

  const contributed = monthlyCents * horizonYears * 12;
  return (
    <Card aria-label="Optional investing idea" className="border-kbc-sky/40">
      <div className="flex items-center gap-2 text-kbc-sky-dark">
        <Icon name="sparkle" />
        <span className="text-xs font-semibold uppercase tracking-wide">Safety net ready · optional idea</span>
      </div>
      <h3 className="mt-1 text-base font-semibold text-kbc-navy">What the money you free could do over {horizonYears} years</h3>
      <p className="mt-1 text-sm text-kbc-navy/90">
        With your emergency fund in place, the {formatCents(monthlyCents)}/month you&apos;d free by dropping a subscription could be invested.
        These are <strong>illustrative long-term averages</strong>, not a forecast:
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Illustrative value of {formatCents(monthlyCents)} invested monthly for {horizonYears} years</caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-kbc-muted">
              <th scope="col" className="py-1 pr-2 font-semibold">Index (illustrative)</th>
              <th scope="col" className="py-1 pr-2 text-right font-semibold">Avg/yr</th>
              <th scope="col" className="py-1 text-right font-semibold">Value in {horizonYears}y</th>
            </tr>
          </thead>
          <tbody>
            {indexes.map(row => (
              <tr key={row.id} className="border-t border-kbc-line">
                <td className="py-1.5 pr-2">{row.label}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums text-kbc-muted">~{row.ratePct}%</td>
                <td className="py-1.5 text-right font-semibold tabular-nums">{formatCents(projectMonthly(monthlyCents, row.ratePct, horizonYears))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-kbc-line text-kbc-muted">
              <td className="py-1.5 pr-2">You would put in</td>
              <td className="py-1.5 pr-2" />
              <td className="py-1.5 text-right tabular-nums">{formatCents(contributed)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div role="note" className="mt-3 rounded-lg border-l-4 border-kbc-warn bg-kbc-warn-soft p-3 text-xs text-kbc-navy/90">
        <p className="flex items-center gap-1.5 font-semibold text-kbc-warn"><Icon name="info" className="h-4 w-4" /> Please read</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>Illustrative only — this is general guidance, not personal advice, and not a KBC product or promise.</li>
          <li>Past performance does not predict future results. Investing puts your capital at risk and you can lose money.</li>
          <li><strong>KBC is not liable for any investment losses.</strong></li>
          <li>Only consider investing once your emergency fund is in place.</li>
        </ul>
      </div>
    </Card>
  );
}
