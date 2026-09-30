'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Action, CustomerEvent, ErrorCode, MomentsService, Snapshot } from '@/lib/types';
import { createMomentsService } from '@/lib/service';
import { useServiceSession, type ServiceSession } from './useServiceSession';

interface MomentsState extends ServiceSession<Snapshot, CustomerEvent, ErrorCode> {
  primary: Action | null;
  serviceLabel: string;
}

const MomentsContext = createContext<MomentsState | null>(null);

export function MomentsProvider({ children, service }: { children: ReactNode; service?: MomentsService }) {
  const session = useServiceSession<Snapshot, CustomerEvent, ErrorCode>(() => service ?? createMomentsService());
  const { snapshot } = session;
  const primary = useMemo(
    () => snapshot?.actions.find(a => a.id === snapshot.decision.primaryActionId) ?? null,
    [snapshot],
  );
  const value = useMemo<MomentsState>(
    () => ({ ...session, primary, serviceLabel: 'Moments service · in-process, synthetic data' }),
    [session, primary],
  );
  return <MomentsContext.Provider value={value}>{children}</MomentsContext.Provider>;
}

export function useMoments(): MomentsState {
  const ctx = useContext(MomentsContext);
  if (!ctx) throw new Error('useMoments must be used inside <MomentsProvider>');
  return ctx;
}
