// DEMO: Saving concept preview — not connected to the engine.
// Local, isolated model with the exact synthetic Japan example from README.md / the frontend handoff.
// It is NOT a v1 Snapshot, invents no engine RuleId and does not touch lib/types.ts.
// The future Codex Saving contract replaces this file.

export const SAVING_PREVIEW_LABEL = 'Concept preview';

export interface RecurringStream {
  id: 'stream-a' | 'stream-b' | 'stream-c';
  label: string;
  amountCents: number;
  /** Synthetic charge dates, to show the recurring pattern. */
  charges: string[];
}

export const savingScenario = {
  demoDate: '2026-10-01',
  goal: { name: 'Japan trip', targetCents: 200000, savedCents: 65000, deadline: '2027-08-01' },
  contribution: { amountCents: 12500, firstDate: '2026-11-01', label: 'on the first of each month' },
  streams: [
    { id: 'stream-a', label: 'Stream A', amountCents: 1300, charges: ['2026-07-04', '2026-08-04', '2026-09-04'] },
    { id: 'stream-b', label: 'Stream B', amountCents: 1500, charges: ['2026-07-12', '2026-08-12', '2026-09-12'] },
    { id: 'stream-c', label: 'Stream C', amountCents: 1000, charges: ['2026-07-21', '2026-08-21', '2026-09-21'] },
  ] satisfies RecurringStream[],
} as const;

export const streamsTotalCents = savingScenario.streams.reduce((sum, s) => sum + s.amountCents, 0); // 3800

export interface Projection {
  monthlyCents: number;
  contributions: number;
  completionDate: string; // YYYY-MM-DD
  meetsDeadline: boolean;
}

function addMonthsIso(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** ceil((target − saved) / monthly) contributions, zero interest, uninterrupted, first on firstDate. */
export function project(monthlyCents: number): Projection {
  const { goal, contribution } = savingScenario;
  const gap = goal.targetCents - goal.savedCents;
  const contributions = Math.ceil(gap / monthlyCents);
  const completionDate = addMonthsIso(contribution.firstDate, contributions - 1);
  return { monthlyCents, contributions, completionDate, meetsDeadline: completionDate <= goal.deadline };
}

export type SavingStatus = 'suggested' | 'identified' | 'planned' | 'kept' | 'dismissed';

export interface SavingState {
  status: SavingStatus;
  identifiedStreamId: RecurringStream['id'] | null;
  /** Guided Kate history for the Kate tab. */
  history: { from: 'kate' | 'customer'; text: string }[];
}

export type SavingEvent =
  | { type: 'IDENTIFY_STREAM'; streamId: RecurringStream['id'] }
  | { type: 'ADD_TO_PLAN' }
  | { type: 'KEEP_SERVICE' }
  | { type: 'NOT_NOW' }
  | { type: 'RESET' };

export const OPENING_QUESTION =
  'You have three recurring streaming charges totalling €38/month. Is there one you no longer use?';

export const initialSavingState: SavingState = {
  status: 'suggested',
  identifiedStreamId: null,
  history: [{ from: 'kate', text: OPENING_QUESTION }],
};

export function streamById(id: RecurringStream['id'] | null) {
  return savingScenario.streams.find(s => s.id === id) ?? null;
}

const euros = (cents: number) => `€${(cents / 100).toLocaleString('en-BE')}`;

export function savingReducer(state: SavingState, event: SavingEvent): SavingState {
  switch (event.type) {
    case 'IDENTIFY_STREAM': {
      if (state.status !== 'suggested' && state.status !== 'identified') return state;
      const stream = streamById(event.streamId);
      if (!stream) return state;
      return {
        status: 'identified', identifiedStreamId: stream.id,
        history: [...state.history,
          { from: 'customer', text: `I no longer use ${stream.label}.` },
          { from: 'kate', text: `If you stop ${stream.label} and put that ${euros(stream.amountCents)}/month towards Japan, your projected finish changes. Want to add it to your plan?` }],
      };
    }
    case 'ADD_TO_PLAN': {
      if (state.status !== 'identified') return state;
      const stream = streamById(state.identifiedStreamId);
      return { ...state, status: 'planned',
        history: [...state.history, { from: 'customer', text: 'Add to my plan.' },
          { from: 'kate', text: `Planned: ${euros(stream?.amountCents ?? 0)}/month towards Japan. Your subscription is not cancelled and your saved amount stays the same until contributions arrive.` }] };
    }
    case 'KEEP_SERVICE': {
      if (state.status !== 'identified') return state;
      return { ...state, status: 'kept', identifiedStreamId: state.identifiedStreamId,
        history: [...state.history, { from: 'customer', text: 'Keep this service.' },
          { from: 'kate', text: 'Got it, it stays. No saving is counted, and I will not bring this up again here.' }] };
    }
    case 'NOT_NOW': {
      if (state.status !== 'suggested' && state.status !== 'identified') return state;
      return { ...state, status: 'dismissed',
        history: [...state.history, { from: 'customer', text: 'Not now.' },
          { from: 'kate', text: 'Okay. I will stay quiet about this in this preview; your plan is unchanged.' }] };
    }
    case 'RESET':
      return initialSavingState;
  }
}

/** Planned monthly contribution for the current state. Only a planned intention changes the projection. */
export function plannedMonthlyCents(state: SavingState): number {
  const stream = state.status === 'planned' ? streamById(state.identifiedStreamId) : null;
  return savingScenario.contribution.amountCents + (stream?.amountCents ?? 0);
}
