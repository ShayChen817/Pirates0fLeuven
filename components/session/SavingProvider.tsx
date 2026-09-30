'use client';

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { initialSavingState, savingReducer, type SavingEvent, type SavingState } from '@/components/demo/savingPreview';

// DEMO: Saving concept preview — not connected to the engine.
const SavingContext = createContext<{ state: SavingState; dispatch: Dispatch<SavingEvent> } | null>(null);

export function SavingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(savingReducer, initialSavingState);
  return <SavingContext.Provider value={{ state, dispatch }}>{children}</SavingContext.Provider>;
}

export function useSaving() {
  const ctx = useContext(SavingContext);
  if (!ctx) throw new Error('useSaving must be used inside <SavingProvider>');
  return ctx;
}
