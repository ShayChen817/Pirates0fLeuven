'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Action, CustomerEvent, ErrorCode, MomentsService, Snapshot } from '@/lib/types';
// Integration point: swap for `createMomentsService` from '@/lib/service' once it exists.
import { createFixtureMomentsService, FIXTURE_ADAPTER_LABEL } from '@/components/demo/fixtureMomentsService';

interface MomentsState {
  snapshot: Snapshot | null;
  primary: Action | null;
  pending: CustomerEvent['type'] | null;
  error: { code: ErrorCode; message: string } | null;
  transportError: string | null;
  serviceLabel: string;
  send: (event: CustomerEvent) => Promise<boolean>;
  clearError: () => void;
  reload: () => void;
}

const MomentsContext = createContext<MomentsState | null>(null);

export function MomentsProvider({ children, service: injected }: { children: ReactNode; service?: MomentsService }) {
  // One service per mounted demo session — never per render, never process-wide.
  const [service] = useState<MomentsService>(() => injected ?? createFixtureMomentsService());
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [pending, setPending] = useState<CustomerEvent['type'] | null>(null);
  const [error, setError] = useState<MomentsState['error']>(null);
  const [transportError, setTransportError] = useState<string | null>(null);
  const snapshotRef = useRef<Snapshot | null>(null);
  const inFlight = useRef(false);

  const adopt = (next: Snapshot) => {
    const frozen = Object.freeze(next);
    snapshotRef.current = frozen;
    setSnapshot(frozen);
  };

  const reload = useCallback(() => {
    setTransportError(null);
    service.getSnapshot().then(adopt).catch(() => setTransportError('Could not load your overview. Please try again.'));
  }, [service]);

  useEffect(() => { reload(); }, [reload]);

  const send = useCallback(async (event: CustomerEvent) => {
    const current = snapshotRef.current;
    if (!current || inFlight.current) return false; // serialize dispatches
    inFlight.current = true;
    setPending(event.type);
    setTransportError(null);
    try {
      const result = await service.dispatch({ expectedRevision: current.revision, event });
      adopt(result.snapshot); // authoritative on success and on domain error
      setError(result.ok ? null : result.error);
      return result.ok;
    } catch {
      // Transport/runtime failure: keep the last snapshot, never auto-retry a confirmation.
      setTransportError('Something went wrong and nothing was confirmed. Please try again.');
      return false;
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }, [service]);

  const primary = useMemo(
    () => snapshot?.actions.find(a => a.id === snapshot.decision.primaryActionId) ?? null,
    [snapshot],
  );

  const value = useMemo<MomentsState>(() => ({
    snapshot, primary, pending, error, transportError,
    serviceLabel: injected ? 'Moments service' : FIXTURE_ADAPTER_LABEL,
    send, clearError: () => setError(null), reload,
  }), [snapshot, primary, pending, error, transportError, injected, send, reload]);

  return <MomentsContext.Provider value={value}>{children}</MomentsContext.Provider>;
}

export function useMoments(): MomentsState {
  const ctx = useContext(MomentsContext);
  if (!ctx) throw new Error('useMoments must be used inside <MomentsProvider>');
  return ctx;
}
