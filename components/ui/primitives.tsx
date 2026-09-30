'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'chip' | 'text';

const variants: Record<Variant, string> = {
  primary: 'bg-kbc-navy text-white hover:bg-kbc-navy-dark disabled:bg-kbc-muted/60 px-4 py-3 rounded-lg font-semibold',
  secondary: 'border border-kbc-navy text-kbc-navy bg-white hover:bg-kbc-kate px-4 py-3 rounded-lg font-medium',
  chip: 'border border-kbc-sky text-kbc-navy bg-white hover:bg-kbc-kate px-3.5 py-2 rounded-full text-sm font-medium',
  text: 'text-kbc-sky-dark underline-offset-2 hover:underline px-1 py-1 text-sm font-medium',
};

export function Button({ variant = 'primary', className = '', busy, children, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }) {
  return (
    <button type="button" {...rest} disabled={rest.disabled || busy} aria-busy={busy || undefined}
      className={`inline-flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${className}`}>
      {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function Card({ children, className = '', as: Tag = 'section', ...rest }:
  { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article'; 'aria-label'?: string; 'aria-labelledby'?: string }) {
  return <Tag {...rest} className={`rounded-lg border border-kbc-line bg-kbc-card p-4 shadow-card ${className}`}>{children}</Tag>;
}

export function KateAvatar({ size = 'h-9 w-9' }: { size?: string }) {
  return (
    <span aria-hidden="true"
      className={`${size} inline-flex shrink-0 items-center justify-center rounded-full bg-kbc-navy text-sm font-bold text-white ring-2 ring-kbc-sky`}>
      K
    </span>
  );
}

/** Proactive Kate advice card — the single primary action lives here. */
export function KateCard({ title, children, footer, tone = 'kate', label = 'Kate' }:
  { title: string; children: ReactNode; footer?: ReactNode; tone?: 'kate' | 'quiet'; label?: string }) {
  return (
    <article aria-label={`${label}: ${title}`}
      className={`rounded-lg border-l-4 border-kbc-sky p-4 shadow-card ${tone === 'kate' ? 'bg-kbc-kate' : 'bg-white'}`}>
      <div className="flex gap-3">
        <KateAvatar />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-kbc-sky-dark">{label}</p>
          <h3 className="mt-0.5 text-base font-semibold leading-snug text-kbc-navy">{title}</h3>
          <div className="mt-1.5 text-sm leading-relaxed text-kbc-navy/90">{children}</div>
        </div>
      </div>
      {footer ? <div className="mt-3 flex flex-wrap gap-2">{footer}</div> : null}
    </article>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}
      className="h-3 w-full overflow-hidden rounded-full bg-kbc-line">
      <div className="h-full rounded-full bg-kbc-sky" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Badge({ children, tone = 'sky' }: { children: ReactNode; tone?: 'sky' | 'ok' | 'warn' | 'muted' | 'navy' }) {
  const tones = {
    sky: 'bg-kbc-kate text-kbc-navy', ok: 'bg-kbc-ok-soft text-kbc-ok', warn: 'bg-kbc-warn-soft text-kbc-warn',
    muted: 'bg-kbc-bg text-kbc-muted', navy: 'bg-kbc-navy text-white',
  } as const;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Notice({ tone, title, children, onClose }:
  { tone: 'error' | 'info' | 'ok'; title: string; children?: ReactNode; onClose?: () => void }) {
  const styles = {
    error: 'border-kbc-error bg-kbc-error-soft text-kbc-error',
    info: 'border-kbc-sky bg-kbc-kate text-kbc-navy',
    ok: 'border-kbc-ok bg-kbc-ok-soft text-kbc-ok',
  } as const;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border-l-4 p-3 text-sm ${styles[tone]}`}>
      <div className="flex items-start gap-2">
        <Icon name={tone === 'ok' ? 'check' : 'info'} className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          {children ? <div className="mt-0.5 text-kbc-navy/90">{children}</div> : null}
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className="rounded p-0.5 hover:bg-black/5" aria-label="Dismiss message">
            <Icon name="close" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Bottom sheet inside the phone frame (evidence drawers, forms, confirmation). */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-kbc-navy/40" role="presentation"
      onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className="max-h-[88%] overflow-y-auto rounded-t-2xl bg-white p-4 pb-6 shadow-raised">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-kbc-navy">{title}</h2>
          <button type="button" onClick={onClose} autoFocus className="rounded-full p-1.5 text-kbc-muted hover:bg-kbc-bg" aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Row({ label, value, strong, muted }: { label: ReactNode; value: ReactNode; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 text-sm ${strong ? 'border-t border-kbc-line pt-2 font-semibold' : ''} ${muted ? 'text-kbc-muted' : ''}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
