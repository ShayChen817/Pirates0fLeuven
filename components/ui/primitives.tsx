'use client';

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { formatCents } from '@/components/format';

type Variant = 'primary' | 'secondary' | 'chip' | 'text';

const variants: Record<Variant, string> = {
  primary: 'min-h-12 rounded-2xl bg-kbc-blue px-5 text-[15px] font-semibold text-white shadow-soft hover:bg-kbc-blue-ink hover:shadow-lift',
  secondary: 'min-h-12 rounded-2xl bg-tint px-5 text-[15px] font-semibold text-ink hover:bg-[oklch(93%_0.035_235)]',
  chip: 'h-10 rounded-full bg-surface px-4 text-sm font-semibold text-ink ring-1 ring-line hover:ring-kbc-blue',
  text: 'h-10 rounded-full px-2 text-sm font-semibold text-kbc-blue-ink hover:text-kbc-navy',
};

export function Button({ variant = 'primary', className = '', busy, children, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }) {
  return (
    <button type="button" {...rest} disabled={rest.disabled || busy} aria-busy={busy || undefined}
      className={`press inline-flex select-none items-center justify-center gap-2 text-center leading-snug py-2.5 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}>
      {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function Card({ children, className = '', ...rest }:
  { children: ReactNode; className?: string; 'aria-label'?: string; 'aria-labelledby'?: string }) {
  return <section {...rest} className={`rounded-[var(--radius-card)] border border-line/60 bg-surface p-5 ${className}`}>{children}</section>;
}

export function KateAvatar({ size = 'h-10 w-10 text-base' }: { size?: string }) {
  return (
    <span aria-hidden="true"
      className={`${size} inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#34bee9] to-[#087bbd] font-bold text-white shadow-soft`}>
      K
    </span>
  );
}

/** Kate's proactive advice card: the single primary action of a screen lives here. */
export function KateCard({ title, children, actions, quiet, eyebrow = 'Kate' }:
  { title: string; children?: ReactNode; actions?: ReactNode; quiet?: boolean; eyebrow?: string }) {
  return (
    <article aria-label={`${eyebrow}: ${title}`}
      className={`rounded-[var(--radius-card)] p-5 ${quiet ? 'bg-surface/70 ring-1 ring-line' : 'bg-surface shadow-lift'}`}>
      <div className="flex items-start gap-3">
        <KateAvatar />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-kbc-blue-ink">{eyebrow}</p>
          <h3 className="mt-0.5 text-[17px] font-semibold leading-snug text-ink">{title}</h3>
        </div>
      </div>
      {children ? <div className="mt-3 text-[15px] leading-relaxed text-ink-2">{children}</div> : null}
      {actions ? <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div> : null}
    </article>
  );
}

export function ProgressBar({ value, max, label, tone = 'blue' }: { value: number; max: number; label: string; tone?: 'blue' | 'green' | 'light' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const [shown, setShown] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(pct)); return () => cancelAnimationFrame(id); }, [pct]);
  const fill = tone === 'green' ? 'bg-kbc-green' : tone === 'light' ? 'bg-white' : 'bg-kbc-blue';
  const track = tone === 'light' ? 'bg-white/20' : 'bg-line';
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}
      className={`h-2 w-full overflow-hidden rounded-full ${track}`}>
      <div className={`h-full rounded-full ${fill} transition-[width] duration-700 ease-[var(--ease-out)]`} style={{ width: `${shown}%` }} />
    </div>
  );
}

/** Counts from the previous amount to the new one, so a change is felt, not just shown. */
export function AnimatedAmount({ cents, className = '' }: { cents: number; className?: string }) {
  const [shown, setShown] = useState(cents);
  const from = useRef(cents);
  useEffect(() => {
    const start = from.current;
    if (start === cents) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { from.current = cents; setShown(cents); return; }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 650);
      const eased = 1 - Math.pow(1 - p, 3);
      if (p < 1) { setShown(Math.round((start + (cents - start) * eased) / 100) * 100); raf = requestAnimationFrame(tick); }
      else { setShown(cents); from.current = cents; }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = cents; };
  }, [cents]);
  return (
    <span className={`tabular-nums ${className}`}>
      <span aria-hidden="true">{formatCents(shown)}</span>
      <span className="sr-only">{formatCents(cents)}</span>
    </span>
  );
}

export function Badge({ children, tone = 'tint' }: { children: ReactNode; tone?: 'tint' | 'ok' | 'warn' | 'muted' | 'navy' }) {
  const tones = {
    tint: 'bg-tint text-kbc-blue-ink', ok: 'bg-ok-soft text-kbc-green-ink', warn: 'bg-warn-soft text-warn',
    muted: 'bg-canvas text-ink-3', navy: 'bg-kbc-navy text-white',
  } as const;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${tones[tone]}`}>{children}</span>;
}

export function Notice({ tone, title, children, onClose }:
  { tone: 'error' | 'info' | 'ok'; title: string; children?: ReactNode; onClose?: () => void }) {
  const styles = { error: 'bg-error-soft text-error', info: 'bg-tint text-ink', ok: 'bg-ok-soft text-kbc-green-ink' } as const;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`animate-rise rounded-2xl p-4 text-sm ${styles[tone]}`}>
      <div className="flex items-start gap-2.5">
        <Icon name={tone === 'ok' ? 'check' : 'info'} className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          {children ? <div className="mt-0.5 text-ink-2">{children}</div> : null}
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className="press -m-1 rounded-full p-1 hover:bg-black/5" aria-label="Dismiss message">
            <Icon name="close" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** iOS-style bottom sheet inside the phone screen. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!target || !dialog.current) return;
    const previous = document.activeElement as HTMLElement | null;
    const siblings = [...target.children].filter(el => el instanceof HTMLElement && !el.classList.contains('sheet-layer')) as HTMLElement[];
    const old = siblings.map(el => el.inert);
    siblings.forEach(el => { el.inert = true; });
    dialog.current.focus({ preventScroll: true });
    return () => {
      siblings.forEach((el, index) => { el.inert = old[index]; });
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [target]);
  useEffect(() => { setTarget(document.getElementById('phone-screen')); }, []);
  if (!target) return null;
  return createPortal(
    <div className="sheet-layer absolute inset-0 z-[60] flex flex-col justify-end" onKeyDown={e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); }
      if (e.key === 'Tab') {
        const elements = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex="0"]') ?? [])].filter(el => el.getClientRects().length);
        const first = elements[0], last = elements[elements.length - 1];
        if (!first) { e.preventDefault(); return; }
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last.focus({ preventScroll: true }); }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { e.preventDefault(); first.focus({ preventScroll: true }); }
      }
    }}>
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 animate-fade bg-kbc-navy/35 backdrop-blur-[2px]" />
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className="no-scrollbar relative max-h-[86%] animate-sheet overflow-y-auto rounded-t-[28px] bg-surface px-5 pb-8 pt-2 shadow-lift">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" aria-hidden="true" />
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="press rounded-full bg-canvas p-2 text-ink-2 hover:bg-tint" aria-label="Close">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    target,
  );
}

export function Row({ label, value, strong, muted }: { label: ReactNode; value: ReactNode; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3 py-2 text-[15px] ${strong ? 'mt-1 border-t border-line pt-3 font-semibold text-ink' : muted ? 'text-ink-3' : 'text-ink-2'}`}>
      <dt>{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  );
}

/** Navy header block that the status bar sits on, like the KBC Mobile home. */
export function Hero({ eyebrow, title, children }: { eyebrow?: ReactNode; title?: ReactNode; children?: ReactNode }) {
  return (
    <div className="bg-kbc-navy px-6 pb-10 pt-4 text-white">
      {eyebrow ? <div className="text-[13px] font-medium text-white/70">{eyebrow}</div> : null}
      {title ? <h2 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">{title}</h2> : null}
      {children}
    </div>
  );
}

/** White content sheet overlapping the hero with rounded top corners. */
export function Body({ children }: { children: ReactNode }) {
  return <div className="relative -mt-4 space-y-5 rounded-t-[28px] bg-canvas px-5 pb-6 pt-6">{children}</div>;
}

export function Checklist({ items }: { items: { ok: boolean; text: ReactNode }[] }) {
  return (
    <ul className="space-y-2 text-[15px] text-ink-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5">
          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${it.ok ? 'bg-ok-soft text-kbc-green-ink' : 'bg-tint text-kbc-blue-ink'}`}>
            <Icon name={it.ok ? 'check' : 'info'} className="h-3 w-3" />
          </span>
          <span>{it.text}</span>
        </li>
      ))}
    </ul>
  );
}
