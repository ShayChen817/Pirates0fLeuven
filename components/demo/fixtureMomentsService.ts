// DEMO: fixture-backed MomentsService adapter. It replays only the documented demoTransitions
// from data/demo-fixtures.ts. It is NOT the decision engine: it evaluates no rules and rejects every
// event it cannot map to a golden fixture. Replace with createMomentsService() from '@/lib/service'
// when Codex ships it (see docs/FRONTEND.md).
import type { CustomerEvent, DispatchResult, ErrorCode, FixtureId, MomentsService, Snapshot } from '@/lib/types';
import { demoTransitions, getDemoSnapshot } from '@/data/demo-fixtures';

export const FIXTURE_ADAPTER_LABEL = 'Fixture adapter (demo) — not the decision engine';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const ENGINE_ONLY: CustomerEvent['type'][] = ['DISMISS_ACTION', 'CLEAR_CONTEXT', 'SET_PROACTIVE'];

function unsupportedMessage(event: CustomerEvent): { code: ErrorCode; message: string } {
  if (ENGINE_ONLY.includes(event.type)) {
    return { code: 'INVALID_EVENT', message: 'This control needs the decision engine, which is not connected yet. Nothing was changed.' };
  }
  if (event.type === 'CONFIRM_MOVING') {
    return { code: 'INVALID_EVENT', message: 'The fixture preview only covers the documented €2,500 move on 1 November 2026. Other amounts or dates need the decision engine. Nothing was changed.' };
  }
  if (event.type === 'CONFIRM_SIMULATION') {
    return { code: 'INVALID_EVENT', message: 'The fixture preview only confirms the documented €1,500 simulation. Other amounts need the decision engine. Nothing was changed.' };
  }
  if (event.type === 'REPORT_COVERAGE' && event.coverage === 'confirmed-need') {
    return { code: 'INVALID_EVENT', message: '“I need cover” is not in the fixture preview yet; it needs the decision engine. Nothing was changed.' };
  }
  return { code: 'ACTION_NOT_AVAILABLE', message: 'That step is not available right now. Please review the current step.' };
}

/** One instance per mounted demo session. State lives in this closure only. */
export function createFixtureMomentsService(options: { latencyMs?: number } = {}): MomentsService {
  const latency = options.latencyMs ?? 350;
  let fixtureId: FixtureId = 'initial';
  let revision = 1;
  const load = (id: FixtureId): Snapshot => ({ ...getDemoSnapshot(id), revision });
  let snapshot = load('initial');
  const current = () => structuredClone(snapshot);
  const wait = () => new Promise(resolve => setTimeout(resolve, latency));

  return {
    async getSnapshot() {
      await wait();
      return current();
    },
    async dispatch({ expectedRevision, event }): Promise<DispatchResult> {
      await wait();
      if (expectedRevision !== revision) {
        return { ok: false, snapshot: current(), error: { code: 'REVISION_CONFLICT',
          message: 'Your plan changed since this screen was shown. Please review the latest step before confirming.' } };
      }
      if (event.type === 'RESET_DEMO') {
        fixtureId = 'initial';
        revision += 1;
        snapshot = load('initial');
        return { ok: true, snapshot: current() };
      }
      const match = demoTransitions.find(t => t.from === fixtureId && canonical(t.request.event) === canonical(event));
      if (!match) return { ok: false, snapshot: current(), error: unsupportedMessage(event) };
      fixtureId = match.to;
      revision += 1;
      snapshot = load(match.to);
      return { ok: true, snapshot: current() };
    },
  };
}
