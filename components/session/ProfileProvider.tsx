'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { createProfileService, type ProfileEvent, type ProfileSnapshot } from '@/lib/profile';
import { useServiceSession, type ServiceSession } from './useServiceSession';

type Session = ServiceSession<ProfileSnapshot, ProfileEvent, 'INVALID_EVENT' | 'REVISION_CONFLICT'>;
const Context = createContext<Session | null>(null);
export function ProfileProvider({ children }: { children: ReactNode }) {
  const session = useServiceSession(createProfileService);
  return <Context.Provider value={session}>{children}</Context.Provider>;
}
export function useProfile() {
  const session = useContext(Context);
  if (!session) throw new Error('ProfileProvider is required.');
  return session;
}
