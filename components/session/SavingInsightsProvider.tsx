'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { createSavingInsightsService } from '@/lib/saving-insights';
import type { SavingInsightsEvent, SavingInsightsResult, SavingInsightsSnapshot } from '@/lib/saving-insights-types';
import { useServiceSession, type ServiceSession } from './useServiceSession';
type ErrorCode = Extract<SavingInsightsResult, { ok: false }>['error']['code'];
const Context = createContext<ServiceSession<SavingInsightsSnapshot, SavingInsightsEvent, ErrorCode> | null>(null);
export function SavingInsightsProvider({ children }: { children: ReactNode }) {
  const session = useServiceSession(createSavingInsightsService);
  return <Context.Provider value={session}>{children}</Context.Provider>;
}
export function useSavingInsights() {
  const session = useContext(Context);
  if (!session) throw new Error('Saving insights require SavingInsightsProvider.');
  return session;
}
