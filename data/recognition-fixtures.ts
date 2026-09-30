import type { RecognitionSeed } from '../lib/recognition-types.ts';

// DEMO: two independent synthetic payments already reflected in the account balance.
const moving: RecognitionSeed = {
  asOf: '2026-10-01T12:00:00.000Z',
  purchases: [
    { id: 'furniture-sep25', merchantId: 'demo-furniture', merchantLabel: 'Demo Furniture',
      category: 'furniture', amountCents: 12000, currency: 'EUR', postedAt: '2026-09-25T12:00:00.000Z', channel: 'physical' },
    { id: 'moving-sep28', merchantId: 'demo-moving', merchantLabel: 'Demo Moving Services',
      category: 'moving-service', amountCents: 5000, currency: 'EUR', postedAt: '2026-09-28T12:00:00.000Z', channel: 'online' },
  ],
  location: { city: 'Ghent', observedAt: '2026-10-01T10:00:00.000Z', source: 'device-coarse' },
};
export function getRecognitionDemoSeed(): RecognitionSeed { return structuredClone(moving); }
