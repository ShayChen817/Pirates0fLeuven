import type { ReactNode } from 'react';

export interface DonutSlice {
  label: string;
  value: number;
  highlight?: boolean;
}

/**
 * Emphasis donut: one highlighted slice in the KBC accent, the rest in a light->dark
 * neutral ramp (distinguished by lightness, so it stays colour-blind safe). Marks are
 * separated by a small surface gap; identity is carried by the legend, never colour alone.
 * Text uses ink tokens, not the slice colour.
 */
const ACCENT = '#00aeef'; // kbc-sky — the one salient slice
const NEUTRALS = ['#334a5e', '#4f6274', '#7d8b98', '#a7b1bb', '#c9d0d7']; // dark -> light, hue-neutral

const TAU = Math.PI * 2;

export function Donut({
  data,
  size = 148,
  thickness = 20,
  centerTop,
  centerMain,
  gapDegrees = 3,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerTop?: ReactNode;
  centerMain?: ReactNode;
  gapDegrees?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const gap = (gapDegrees / 360) * TAU;

  // Largest first for a calmer read; assign neutrals in that order, accent stays put.
  const ordered = [...data].sort((a, b) => b.value - a.value);
  let neutralIndex = 0;
  const withColor = ordered.map(slice => ({
    ...slice,
    color: slice.highlight ? ACCENT : NEUTRALS[Math.min(neutralIndex++, NEUTRALS.length - 1)],
    fraction: total > 0 ? slice.value / total : 0,
  }));

  let angle = -Math.PI / 2; // start at 12 o'clock
  const arcs = withColor.map(slice => {
    const sweep = slice.fraction * TAU;
    const start = angle + gap / 2;
    const end = angle + sweep - gap / 2;
    angle += sweep;
    if (end <= start) return null; // too thin to draw with a gap
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    return (
      <path key={slice.label} d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        fill="none" stroke={slice.color} strokeWidth={thickness} strokeLinecap="butt" />
    );
  });

  const summary = `Spending by category: ${withColor.map(s => `${s.label} ${Math.round(s.fraction * 100)}%`).join(', ')}.`;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={summary}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef1f4" strokeWidth={thickness} />
          {arcs}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerTop ? <span className="text-[10px] font-semibold uppercase tracking-wide text-kbc-muted">{centerTop}</span> : null}
          {centerMain ? <span className="text-lg font-bold leading-tight text-kbc-navy tabular-nums">{centerMain}</span> : null}
        </div>
      </div>

      <ul className="w-full space-y-1.5" aria-hidden="false">
        {withColor.map(slice => (
          <li key={slice.label} className="flex items-center gap-2 text-sm">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-[3px]" style={{ backgroundColor: slice.color }} />
            <span className={`flex-1 truncate ${slice.highlight ? 'font-semibold text-kbc-navy' : 'text-kbc-navy/90'}`}>{slice.label}</span>
            <span className="tabular-nums text-kbc-muted">{Math.round(slice.fraction * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
