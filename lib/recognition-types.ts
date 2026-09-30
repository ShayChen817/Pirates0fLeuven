import type { Purchase } from './saving-types.ts';

export interface RecognitionSeed {
  asOf: string;
  purchases: Purchase[];
  location: null | { city: string; observedAt: string; source: 'device-coarse' };
}
export interface RecognitionPreferences { purchaseHistory: boolean; location: boolean }
export interface RecognitionFeedback {
  hypothesisId: string; decision: 'confirm' | 'reject' | 'later'; at: string;
}
export interface MissionHypothesis {
  id: string; mission: 'moving'; status: 'possible'; evidenceIds: string[];
  title: string; question: string;
  cityContext: string | null; // supporting context only, never a confirmed destination
  reasonCode: 'RELATED_MOVING_PURCHASES';
}
export interface RecognitionSnapshot {
  contractVersion: 'recognition-1.0'; revision: number; asOf: string;
  preferences: RecognitionPreferences;
  hypothesis: MissionHypothesis | null;
  confirmedMission: 'moving' | null;
  feedback: RecognitionFeedback[];
  trace: { reasonCode: 'PURCHASE_SOURCE_DISABLED' | 'INSUFFICIENT_EVIDENCE' | 'RECENT_FEEDBACK' | 'MISSION_CONFIRMED' | 'POSSIBLE_MOVE';
    evidenceIds: string[]; locationUsed: boolean };
}
export type RecognitionEvent =
  | { type: 'SET_SOURCES'; purchaseHistory: boolean; location: boolean }
  | { type: 'RECORD_FEEDBACK'; hypothesisId: string; decision: 'confirm' | 'reject' | 'later' }
  | { type: 'CLEAR_CONFIRMED_MISSION' }
  | { type: 'RESET_DEMO' };
export type RecognitionResult = { ok: true; snapshot: RecognitionSnapshot } |
  { ok: false; error: { code: 'INVALID_EVENT' | 'REVISION_CONFLICT' | 'ACTION_NOT_AVAILABLE'; message: string }; snapshot: RecognitionSnapshot };
export interface RecognitionService {
  getSnapshot(): Promise<RecognitionSnapshot>;
  dispatch(request: { expectedRevision: number; event: RecognitionEvent }): Promise<RecognitionResult>;
}
