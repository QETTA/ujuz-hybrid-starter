import type { PlaceInsights } from '@/app/types/dataBlock';

const now = Date.now();

export const MOCK_PLACE_INSIGHTS: Map<string, PlaceInsights> = new Map([
  [
    'place-1',
    {
      waitTime: {
        value: '23분',
        source: 'user_report',
        updatedAt: new Date(now - 2 * 60 * 1000),
        confidence: 0.87,
      },
      dealCount: {
        value: 3,
        source: 'public_api',
        updatedAt: new Date(now - 10 * 60 * 1000),
        confidence: 0.95,
      },
      crowdLevel: {
        value: '혼잡',
        source: 'inference',
        updatedAt: new Date(now - 15 * 60 * 1000),
        confidence: 0.72,
      },
      peerVisits: {
        value: '이번 주 12명',
        source: 'user_report',
        updatedAt: new Date(now - 60 * 60 * 1000),
        confidence: 0.8,
      },
    },
  ],
  [
    'place-2',
    {
      waitTime: {
        value: '8분',
        source: 'user_report',
        updatedAt: new Date(now - 6 * 60 * 1000),
        confidence: 0.74,
      },
      dealCount: {
        value: 1,
        source: 'public_api',
        updatedAt: new Date(now - 30 * 60 * 1000),
        confidence: 0.9,
      },
      safetyScore: {
        value: '0.91',
        source: 'public_api',
        updatedAt: new Date(now - 2 * 60 * 60 * 1000),
        confidence: 0.92,
      },
    },
  ],
  [
    'mock-1',
    {
      waitTime: {
        value: '18분',
        source: 'user_report',
        updatedAt: new Date(now - 12 * 60 * 1000),
        confidence: 0.82,
      },
      dealCount: {
        value: 2,
        source: 'public_api',
        updatedAt: new Date(now - 45 * 60 * 1000),
        confidence: 0.9,
      },
    },
  ],
  [
    'mock-2',
    {
      crowdLevel: {
        value: '여유',
        source: 'inference',
        updatedAt: new Date(now - 20 * 60 * 1000),
        confidence: 0.67,
      },
      safetyScore: {
        value: '0.94',
        source: 'public_api',
        updatedAt: new Date(now - 4 * 60 * 60 * 1000),
        confidence: 0.96,
      },
    },
  ],
]);
