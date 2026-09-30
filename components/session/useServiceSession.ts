'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Result<S, C> = { ok: true; snapshot: S } | { ok: false; error: { code: C; message: string }; snapshot: S };
export interface SessionService<S, E, C> {
  getSnapshot(): Promise<S>;
  dispatch(request: { expectedRevision: number; event: E }): Promise<Result<S, C>>;
}

export interface ServiceSession<S, E extends { type: string }, C> {
  snapshot: S | null;
  pending: E['type'] | null;
  error: { code: C; message: string } | null;
  transportError: string | null;
  send: (event: E) => Promise<boolean>;
  clearError: () => void;
  reload: () => void;
}

/**
 * One service instance per mounted session. Dispatches are serialized, the returned snapshot is
 * adopted on success and on domain error, and nothing is retried automatically.
 */
export function useServiceSession<S extends { revision: number }, E extends { type: string }, C>(
  factory: () => SessionService<S, E, C>,
): ServiceSession<S, E, C> {
  const [service] = useState(factory);
  const [snapshot, setSnapshot] = useState<S | null>(null);
  const [pending, setPending] = useState<E['type'] | null>(null);
  const [error, setError] = useState<{ code: C; message: string } | null>(null);
  const [transportError, setTransportError] = useState<string | null>(null);
  const snapshotRef = useRef<S | null>(null);
  const inFlight = useRef(false);

  const adopt = useCallback((next: S) => {
    const frozen = Object.freeze(next);
    snapshotRef.current = frozen;
    setSnapshot(frozen);
  }, []);

  const reload = useCallback(() => {
    setTransportError(null);
    service.getSnapshot().then(adopt).catch(() => setTransportError('Could not load your overview. Please try again.'));
  }, [service, adopt]);

  useEffect(() => { reload(); }, [reload]);

  const send = useCallback(async (event: E) => {
    const current = snapshotRef.current;
    if (!current || inFlight.current) return false;
    inFlight.current = true;
    setPending(event.type);
    setTransportError(null);
    try {
      const result = await service.dispatch({ expectedRevision: current.revision, event });
      adopt(result.snapshot);
      setError(result.ok ? null : result.error);
      return result.ok;
    } catch {
      setTransportError('Something went wrong and nothing was confirmed. Please try again.');
      return false;
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }, [service, adopt]);

  const clearError = useCallback(() => setError(null), []);
  return useMemo(() => ({ snapshot, pending, error, transportError, send, clearError, reload }),
    [snapshot, pending, error, transportError, send, clearError, reload]);
}
