'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SavingEvent, SavingResult, SavingService, SavingSnapshot } from '@/lib/saving-types';
import { createSavingService } from '@/lib/saving';
import { useServiceSession, type ServiceSession } from './useServiceSession';

type SavingErrorCode = Extract<SavingResult, { ok: false }>['error']['code'];
type SavingState = ServiceSession<SavingSnapshot, SavingEvent, SavingErrorCode>;

const SavingContext = createContext<SavingState | null>(null);

/** Separate saving-1.0 session; never shares or double-allocates the Moving balance. */
export function SavingProvider({ children, service }: { children: ReactNode; service?: SavingService }) {
  const session = useServiceSession<SavingSnapshot, SavingEvent, SavingErrorCode>(() => service ?? createSavingService());
  return <SavingContext.Provider value={session}>{children}</SavingContext.Provider>;
}

export function useSaving(): SavingState {
  const ctx = useContext(SavingContext);
  if (!ctx) throw new Error('useSaving must be used inside <SavingProvider>');
  return ctx;
}
