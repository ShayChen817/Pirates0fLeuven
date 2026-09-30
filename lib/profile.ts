import { exactKeys, positiveInteger, record } from './validation.ts';

export const PREFERENCE_LABELS = {
  subscriptions: 'Review subscriptions',
  coffee: 'Spend less on coffee',
  moving: 'Prepare a move',
  saving: 'Build my savings',
} as const;
export type Preference = keyof typeof PREFERENCE_LABELS;
export interface ProfileSnapshot {
  contractVersion: 'profile-1.0'; revision: number; displayName: 'Shay';
  bio: string; proposed: Preference[]; confirmed: Preference[];
  status: 'empty' | 'review' | 'confirmed'; source: 'local-keywords' | 'customer';
}
export type ProfileEvent =
  | { type: 'SAVE_BIO'; bio: string }
  | { type: 'CONFIRM_PREFERENCES'; preferences: Preference[] }
  | { type: 'CLEAR_PROFILE' };
export type ProfileResult = { ok: true; snapshot: ProfileSnapshot } |
  { ok: false; error: { code: 'INVALID_EVENT' | 'REVISION_CONFLICT'; message: string }; snapshot: ProfileSnapshot };

/** Suggestions only, never inferred financial facts. Explicit confirmation is required. */
export function proposePreferences(bio: string): Preference[] {
  const patterns: Record<Preference, RegExp> = {
    subscriptions: /\b(subscription[s]?|streaming)\b/i,
    coffee: /\bcoffee\b/i,
    moving: /\b(moving|move home|move house)\b/i,
    saving: /\b(sav(e|ing|ings)|japan|travel)\b/i,
  };
  return (Object.keys(patterns) as Preference[]).filter(key => patterns[key].test(bio));
}
export function createProfileService() {
  let state: ProfileSnapshot = { contractVersion: 'profile-1.0', revision: 1, displayName: 'Shay',
    bio: '', proposed: [], confirmed: [], status: 'empty', source: 'customer' };
  const read = () => structuredClone(state);
  const fail = (code: 'INVALID_EVENT' | 'REVISION_CONFLICT', message: string): ProfileResult =>
    ({ ok: false, error: { code, message }, snapshot: read() });
  return {
    async getSnapshot() { return read(); },
    async dispatch(request: { expectedRevision: number; event: ProfileEvent }): Promise<ProfileResult> {
      if (!record(request) || !exactKeys(request, ['expectedRevision', 'event']) || !positiveInteger(request.expectedRevision))
        return fail('INVALID_EVENT', 'Provide a current profile revision.');
      if (request.expectedRevision !== state.revision) return fail('REVISION_CONFLICT', 'Your profile changed. Review the latest version.');
      if (state.revision >= Number.MAX_SAFE_INTEGER || !record(request.event)) return fail('INVALID_EVENT', 'Invalid profile update.');
      const event = request.event;
      if (event.type === 'SAVE_BIO') {
        if (!exactKeys(event, ['type', 'bio']) || typeof event.bio !== 'string' || event.bio.length > 800)
          return fail('INVALID_EVENT', 'Keep your introduction within 800 characters.');
        const bio = event.bio.trim();
        state = { ...state, bio, proposed: proposePreferences(bio), confirmed: [], status: bio ? 'review' : 'empty', source: 'local-keywords' };
      } else if (event.type === 'CONFIRM_PREFERENCES') {
        if (!exactKeys(event, ['type', 'preferences']) || !Array.isArray(event.preferences) ||
          event.preferences.length > 4 || new Set(event.preferences).size !== event.preferences.length ||
          !event.preferences.every(tag => typeof tag === 'string' && Object.hasOwn(PREFERENCE_LABELS, tag)))
          return fail('INVALID_EVENT', 'Choose from the available preferences.');
        // Customer may correct proposed tags or select manually without a bio.
        state = { ...state, confirmed: [...event.preferences], proposed: [], status: 'confirmed', source: 'customer' };
      } else if (event.type === 'CLEAR_PROFILE' && exactKeys(event, ['type'])) {
        state = { ...state, bio: '', proposed: [], confirmed: [], status: 'empty', source: 'customer' };
      } else return fail('INVALID_EVENT', 'Unsupported profile update.');
      state = { ...state, revision: state.revision + 1 };
      return { ok: true, snapshot: read() };
    },
  };
}

/** Applies only to optional discovery; completed plans and necessary financial steps stay visible. */
export function subscriptionRelevance(profile: ProfileSnapshot): 'setup' | 'review' | 'matched' | 'unmatched' {
  if (profile.status === 'empty') return 'setup';
  if (profile.status === 'review') return 'review';
  return profile.confirmed.includes('subscriptions') ? 'matched' : 'unmatched';
}
