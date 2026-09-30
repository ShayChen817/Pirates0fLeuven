'use client';

import { useState } from 'react';
import { MomentsProvider, useMoments } from '@/components/session/MomentsProvider';
import { SavingProvider, useSaving } from '@/components/session/SavingProvider';
import { Icon, type IconName } from '@/components/ui/Icon';
import { MovingHome } from '@/components/moving/MovingHome';
import { MovingKate } from '@/components/moving/MovingKate';
import { EnginePanel } from '@/components/moving/EnginePanel';
import { SavingHome } from '@/components/saving/SavingHome';
import { SavingKate } from '@/components/saving/SavingKate';
import { SavingPreviewPanel } from '@/components/saving/SavingPreviewPanel';
import { IPhone } from './IPhone';
import { ProfileProvider, useProfile } from '@/components/session/ProfileProvider';
import { ProfileScreen } from '@/components/profile/ProfileScreen';

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
      <SavingProvider><ProfileProvider>
        <DemoShell />
      </ProfileProvider></SavingProvider>
    </MomentsProvider>
  );
}

function DemoShell() {
  const [scenario, setScenario] = useState<Scenario>('saving');
  const [tab, setTab] = useState<Tab>('home');
  const moments = useMoments();
  const saving = useSaving();
  const profile = useProfile();
  const resetting = !!profile.pending || !!(scenario === 'saving' ? saving.pending : moments.pending);

  const reset = () => {
    if (scenario === 'saving') void saving.send({ type: 'RESET_DEMO' });
    else void moments.send({ type: 'RESET_DEMO' });
    void profile.send({ type: 'CLEAR_PROFILE' });
    setTab('home');
  };

  const controls = (
    <div className="space-y-5">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-kbc-blue-ink">Life Goals / with Kate</p>
        <h1 className="mt-1 text-[46px] font-semibold leading-[1.06] tracking-tight text-ink">A little closer.<br /><span className="everyday-float text-ink-3">Every day.</span></h1>
        <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-ink-2">Your goals, understood. Thoughtful help from Kate, shaped around what matters to you.</p>
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

  const panelContent = scenario === 'saving' ? <SavingPreviewPanel /> : <EnginePanel />;

  const panel = <details className="demo-details"><summary><span>Behind the experience</span><Icon name="chevron" className="h-4 w-4" /></summary><div className="pt-4">{panelContent}</div></details>;

  const screen = (
    <>
      <div className="phone-pages">
        <div hidden={tab !== 'home'} className="phone-page no-scrollbar" aria-label="Home">
          {scenario === 'saving' ? <SavingHome onProfile={() => setTab('knows')} /> : <MovingHome />}
        </div>
        <div hidden={tab !== 'kate'} className="phone-page no-scrollbar" aria-label="Kate">
          {scenario === 'saving' ? <SavingKate onProfile={() => setTab('knows')} /> : <MovingKate />}
        </div>
        <div hidden={tab !== 'knows'} className="phone-page no-scrollbar" aria-label="Profile"><ProfileScreen scenario={scenario} /></div>
      </div>
      <nav aria-label="App navigation" className="relative z-30 grid shrink-0 grid-cols-3 border-t border-line bg-surface/85 pb-[max(env(safe-area-inset-bottom),26px)] pt-2 backdrop-blur-xl">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
            className={`press relative flex min-h-11 flex-col items-center gap-1 py-1 text-[10px] font-semibold ${tab === t.id ? 'text-kbc-blue' : 'text-ink-3 hover:text-ink'}`}>
            <Icon name={t.icon} className="h-6 w-6" />
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );

  return (
    <main className="demo-layout">
      <aside className="demo-sidebar">
        {controls}
        {panel}
        <p className="text-[11px] leading-relaxed text-ink-3">Pirates0fLeuven · KBC track<br />Synthetic demonstration. Not affiliated with KBC.</p>
      </aside>
      <div className="device-stage"><IPhone dark={tab === 'home'}>{screen}</IPhone></div>
    </main>
  );
}
