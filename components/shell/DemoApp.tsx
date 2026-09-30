'use client';

import { useState } from 'react';
import { MomentsProvider, useMoments } from '@/components/session/MomentsProvider';
import { SavingProvider, useSaving } from '@/components/session/SavingProvider';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/primitives';
import { MovingHome } from '@/components/moving/MovingHome';
import { MovingKate } from '@/components/moving/MovingKate';
import { MovingKnows } from '@/components/moving/MovingKnows';
import { EnginePanel } from '@/components/moving/EnginePanel';
import { SavingHome } from '@/components/saving/SavingHome';
import { SavingKate } from '@/components/saving/SavingKate';
import { SavingKnows } from '@/components/saving/SavingKnows';
import { SavingPreviewPanel } from '@/components/saving/SavingPreviewPanel';

export type Scenario = 'saving' | 'moving';
export type Tab = 'home' | 'kate' | 'knows';

const tabs: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'kate', label: 'Kate', icon: 'chat' },
  { id: 'knows', label: 'What Kate knows', icon: 'user' },
];

export function DemoApp() {
  // Providers stay mounted for the whole page so each scenario keeps its own demo session.
  return (
    <MomentsProvider>
      <SavingProvider>
        <DemoShell />
      </SavingProvider>
    </MomentsProvider>
  );
}

function DemoShell() {
  const [scenario, setScenario] = useState<Scenario>('saving');
  const [tab, setTab] = useState<Tab>('home');
  const moments = useMoments();
  const saving = useSaving();

  const reset = () => {
    if (scenario === 'saving') void saving.send({ type: 'RESET_DEMO' });
    else void moments.send({ type: 'RESET_DEMO' });
    setTab('home');
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-0 pb-8 sm:px-4 sm:pt-4">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-kbc-navy px-4 py-3 text-white sm:rounded-lg">
        <div>
          <h1 className="text-lg font-bold leading-tight">Life Goals with Kate</h1>
          <p className="text-xs text-white/80">Hackathon prototype · synthetic data · demo date 1 October 2026 · not affiliated with KBC</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Demo scenario" className="flex rounded-lg bg-white/10 p-1">
            {([
              ['saving', 'Japan savings'],
              ['moving', 'Moving'],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={scenario === id}
                onClick={() => { setScenario(id); setTab('home'); }}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${scenario === id ? 'bg-white text-kbc-navy' : 'text-white hover:bg-white/10'}`}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={reset} disabled={scenario === 'moving' && !!moments.pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 px-3 py-1.5 text-sm font-medium hover:bg-white/10 disabled:opacity-60">
            <Icon name="reset" className="h-4 w-4" /> Reset demo
          </button>
        </div>
      </header>

      <p className="px-4 text-sm text-kbc-navy/80 sm:px-0">
        {scenario === 'saving'
          ? <>Two independent synthetic scenarios, not one shared balance. <strong>Japan savings</strong> is a local concept preview.</>
          : <>Two independent synthetic scenarios, not one shared balance. <strong>Moving</strong> replays the shared v1 contract fixtures.</>}
      </p>

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
        <PhoneFrame scenario={scenario} tab={tab} onTab={setTab} />
        <aside className="w-full max-w-[420px] px-4 sm:px-0 lg:sticky lg:top-4" aria-label="Behind the scenes">
          {scenario === 'saving' ? <SavingPreviewPanel /> : <EnginePanel />}
        </aside>
      </div>
    </div>
  );
}

function PhoneFrame({ scenario, tab, onTab }: { scenario: Scenario; tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <div className="w-full sm:w-[400px] sm:rounded-[2.5rem] sm:border-[10px] sm:border-kbc-navy-dark sm:shadow-raised">
      <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-kbc-bg sm:h-[min(780px,calc(100dvh-150px))] sm:min-h-[560px] sm:rounded-[1.9rem]">
        <div className="flex items-center justify-between bg-kbc-navy px-4 pb-3 pt-4 text-white">
          <div>
            <p className="text-xs text-white/75">Good afternoon</p>
            <p className="text-base font-semibold">Lotte</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="sky">Synthetic data</Badge>
            <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">L</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-4" id={`panel-${tab}`} aria-label={tabs.find(t => t.id === tab)?.label}>
          {scenario === 'saving'
            ? (tab === 'home' ? <SavingHome onOpenKate={() => onTab('kate')} /> : tab === 'kate' ? <SavingKate /> : <SavingKnows />)
            : (tab === 'home' ? <MovingHome onOpenKate={() => onTab('kate')} /> : tab === 'kate' ? <MovingKate /> : <MovingKnows />)}
        </main>

        <nav aria-label="App navigation" className="grid grid-cols-3 border-t border-kbc-line bg-white">
          {tabs.map(t => (
            <button key={t.id} type="button" onClick={() => onTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${tab === t.id ? 'text-kbc-sky-dark' : 'text-kbc-muted hover:text-kbc-navy'}`}>
              <Icon name={t.icon} />
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
