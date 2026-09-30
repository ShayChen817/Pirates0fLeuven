'use client';

import type { ReactNode } from 'react';
import { KateAvatar } from './primitives';

export type Bubble = { from: 'kate' | 'customer'; text: string };

/** Kate tab: a compact header, the guided history, then the live card. No free-text chat. */
export function KateScreen({ history, children }: { history: Bubble[]; children: ReactNode }) {
  return (
    <>
      <div className="flex items-center gap-3 bg-kbc-navy px-5 pb-5 pt-1 text-white">
        <KateAvatar size="h-11 w-11 text-lg" />
        <div>
          <h2 className="text-lg font-semibold leading-tight">Kate</h2>
          <p className="text-[13px] text-white/70">Guided advice · you reply with buttons</p>
        </div>
      </div>
      <div className="space-y-4 px-4 pb-6 pt-5">
        {history.length ? (
          <ol className="space-y-2.5" aria-label="Conversation history">
            {history.map((b, i) => (
              <li key={i} style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
                className={`flex animate-rise items-end gap-2 ${b.from === 'customer' ? 'justify-end' : ''}`}>
                {b.from === 'kate' ? <KateAvatar size="h-7 w-7 text-xs" /> : null}
                <p className={`max-w-[78%] rounded-[20px] px-4 py-2.5 text-[15px] leading-snug ${b.from === 'kate' ? 'rounded-bl-md bg-surface text-ink shadow-soft' : 'rounded-br-md bg-kbc-blue text-white'}`}>
                  <span className="sr-only">{b.from === 'kate' ? 'Kate: ' : 'You: '}</span>{b.text}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-2 text-center text-[13px] text-ink-3">Today</p>
        )}
        {children}
      </div>
    </>
  );
}
