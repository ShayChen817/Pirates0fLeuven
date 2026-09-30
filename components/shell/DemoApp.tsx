'use client';

import { useEffect, useState } from 'react';
import { MomentsProvider, useMoments } from '@/components/session/MomentsProvider';
import { SavingProvider, useSaving } from '@/components/session/SavingProvider';
import { Icon, type IconName } from '@/components/ui/Icon';
import { MovingHome } from '@/components/moving/MovingHome';
import { MovingKate } from '@/components/moving/MovingKate';
import { MovingKnows } from '@/components/moving/MovingKnows';
import { EnginePanel } from '@/components/moving/EnginePanel';
import { SavingHome } from '@/components/saving/SavingHome';
import { SavingKate } from '@/components/saving/SavingKate';
import { SavingKnows } from '@/components/saving/SavingKnows';
import { SavingPreviewPanel } from '@/components/saving/SavingPreviewPanel';
import { IPhone } from './IPhone';

export type Scenario = 'saving' | 'moving';
export type Tab = 'home' | 'kate' | 'knows';

const tabs: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'kate', label: 'Kate', icon: 'chat' },
  { id: 'knows', label: 'Profile', icon: 'user' },
];

const scenarios: { id: Scenario; label: string; hint: string }[] = [
  { id: 'saving', label: 'Japan savings', hint: 'Goal first: a subscription review moves the projected finish.' },
  { id: 'moving', label: 'Moving', hint: 'Plans change: a €2,500 move reshapes the next steps.' },
];

export function DemoApp() {
  // Providers stay mounted, so each scenario keeps its own session while you switch.
  return (
    <MomentsProvider>
      <SavingProvider>
        <DemoShell />
      </SavingProvider>
    </MomentsProvider>
  );
}

function useWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1100px)');
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return wide;
}

function DemoShell() {
  const [scenario, setScenario] = useState<Scenario>('saving');
  const [tab, setTab] = useState<Tab>('home');
  const moments = useMoments();
  const saving = useSaving();
  const wide = useWide();
  const resetting = scenario === 'saving' ? saving.pending === 'RESET_DEMO' : moments.pending === 'RESET_DEMO';

  const reset = () => {
    if (scenario === 'saving') void saving.send({ type: 'RESET_DEMO' });
    else void moments.send({ type: 'RESET_DEMO' });
    setTab('home');
  };

  const controls = (
    <div className="space-y-5">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-kbc-blue-ink">Pirates0fLeuven · KBC track</p>
        <h1 className="mt-1 text-[32px] font-bold leading-[1.1] tracking-tight text-ink">Life Goals with Kate</h1>
        <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-ink-2">Kate understands the goal first, then suggests one next step, and stays quiet when nothing is needed.</p>
      </div>
      <div role="radiogroup" aria-label="Demo scenario" className="grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1 shadow-soft">
        {scenarios.map(s => (
          <button key={s.id} type="button" role="radio" aria-checked={scenario === s.id}
            onClick={() => { setScenario(s.id); setTab('home'); }}
            className={`press rounded-xl px-3 py-2.5 text-sm font-semibold ${scenario === s.id ? 'bg-kbc-navy text-white shadow-soft' : 'text-ink-2 hover:bg-canvas'}`}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-3">{scenarios.find(s => s.id === scenario)!.hint}</p>
        <button type="button" onClick={reset} disabled={resetting}
          className="press inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-sm font-semibold text-ink shadow-soft hover:shadow-lift disabled:opacity-60">
          <Icon name="reset" className="h-4 w-4" /> Reset
        </button>
      </div>
    </div>
  );

  const panel = scenario === 'saving' ? <SavingPreviewPanel /> : <EnginePanel />;

  const screen = (
    <>
      <div key={`${scenario}-${tab}`} className="no-scrollbar flex-1 animate-fade overflow-y-auto bg-canvas">
        {scenario === 'saving'
          ? (tab === 'home' ? <SavingHome /> : tab === 'kate' ? <SavingKate /> : <SavingKnows />)
          : (tab === 'home' ? <MovingHome /> : tab === 'kate' ? <MovingKate /> : <MovingKnows />)}
      </div>
      <nav aria-label="App navigation" className="relative z-30 grid shrink-0 grid-cols-3 border-t border-line bg-surface/85 pb-[26px] pt-1.5 backdrop-blur-xl">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
            className={`press flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold ${tab === t.id ? 'text-kbc-blue' : 'text-ink-3 hover:text-ink'}`}>
            <Icon name={t.icon} className="h-6 w-6" />
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1200px] flex-col items-center justify-center gap-10 px-0 pb-4 sm:px-8 sm:py-4 min-[1100px]:flex-row min-[1100px]:items-start min-[1100px]:py-0">

      {wide ? (
        <>
          {/* Top-anchored column: height changes in the panel grow downward and never re-centre the layout. */}
          <div className="flex w-[380px] shrink-0 flex-col gap-6 self-start pb-8 pt-[clamp(16px,9dvh,80px)]">
            {controls}
            {panel}
          </div>
          {/* Phone is pinned to the viewport (sticky, centred in one screen height), independent of column height. */}
          <div className="sticky top-0 flex h-dvh shrink-0 items-center self-start">
            <IPhone reserveWidth={380 + 40 + 64}>{screen}</IPhone>
          </div>
        </>
      ) : (
        <>
          <IPhone>{screen}</IPhone>
          <div className="w-full max-w-[420px] space-y-6 px-4 pb-6 sm:px-0">{controls}{panel}</div>
        </>
      )}
    </main>
  );
}
