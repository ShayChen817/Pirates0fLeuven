'use client';

import type { ReactNode } from 'react';
import { KateAvatar } from './primitives';

export type Bubble = { from: 'kate' | 'customer'; text: string };

/** Kate tab: a compact header, the guided history, then the live card. No free-text chat. */
export function KateScreen({ history, children }: { history: Bubble[]; children: ReactNode }) {
  return (
    <>
      <header className="flex items-center gap-3.5 px-6 pb-5 pt-4">
        <KateAvatar size="h-12 w-12 text-xl" />
        <div className="min-w-0">
          <h2 className="text-[27px] font-semibold leading-tight tracking-tight text-ink">Kate</h2>
          <p className="mt-1 text-[14px] leading-snug text-ink-2">A little help for your goals.</p>
        </div>
      </header>
      <div className="space-y-5 px-5 pb-6 pt-1">
        {history.length ? (
          <ol className="space-y-2.5" aria-label="Conversation history">
            {history.map((b, i) => (
              <li key={i} style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
                className={`flex animate-rise items-end gap-2 ${b.from === 'customer' ? 'justify-end' : ''}`}>
                {b.from === 'kate' ? <KateAvatar size="h-7 w-7 text-xs" /> : null}
                <p className={`max-w-[78%] rounded-[20px] px-4 py-2.5 text-[15px] leading-snug ${b.from === 'kate' ? 'rounded-bl-md bg-tint text-ink' : 'rounded-br-md bg-kbc-blue text-white'}`}>
                  <span className="sr-only">{b.from === 'kate' ? 'Kate: ' : 'You: '}</span>{b.text}
                </p>
              </li>
            ))}
          </ol>
        ) : null}
        {children}
      </div>
    </>
  );
}
