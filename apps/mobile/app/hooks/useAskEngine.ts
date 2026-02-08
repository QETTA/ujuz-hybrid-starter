import { useEffect, useMemo, useState, useCallback } from 'react';
import { placesService } from '@/app/services/mongo/places';
import { insightsService } from '@/app/services/mongo/insights';
import { api } from '@/app/services/api/client';
import { useSubscriptionStore } from '@/app/stores/subscriptionStore';
import type { DataBlock, PlaceInsights } from '@/app/types/dataBlock';
import type { PlaceWithDistance } from '@/app/types/places';
import type { BotApiRequest, BotApiResponse, BotDataBlock } from '@/app/types/bot';

export interface AskAnswer {
  summary: string;
  placeId?: string;
  placeName?: string;
  place?: PlaceWithDistance;
  confidence: number;
  blocks: DataBlock[];
  intent?: string;
  suggestions?: string[];
  conversationId?: string;
  source: 'server' | 'local';
}

function toNumber(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/[\d.]+/);
    return match ? Number(match[0]) : null;
  }
  return null;
}

function pickBlocks(insights?: PlaceInsights): DataBlock[] {
  if (!insights) return [];
  const blocks = Object.values(insights).filter((b): b is DataBlock => b != null);
  return blocks.slice(0, 3);
}

function averageConfidence(blocks: DataBlock[]): number {
  if (blocks.length === 0) return 0.5;
  return blocks.reduce((sum, b) => sum + b.confidence, 0) / blocks.length;
}

/** Convert BotDataBlock[] to DataBlock[] for UI compatibility */
function botBlocksToDataBlocks(botBlocks: BotDataBlock[]): DataBlock[] {
  return botBlocks.map((b, i) => ({
    id: `bot-block-${i}`,
    type: b.type as string,
    category: b.type,
    label: b.title,
    value: b.content,
    confidence: b.confidence,
    source: b.source ?? 'bot',
    version: 1,
    updated_at: new Date().toISOString(),
  })) as unknown as DataBlock[];
}

/**
 * Server API call (primary path)
 * POST /api/ujuz/bot/ask
 */
async function askServerApi(
  query: string,
  childAgeMonths?: number,
  conversationId?: string
): Promise<AskAnswer> {
  const request: BotApiRequest = {
    query,
    conversation_id: conversationId,
    context: childAgeMonths ? { child_age_months: childAgeMonths } : undefined,
  };

  const data = await api.post<BotApiResponse>('/api/ujuz/bot/ask', request);

  return {
    summary: data.message,
    confidence:
      data.data_blocks.length > 0
        ? data.data_blocks.reduce((sum: number, b: BotDataBlock) => sum + b.confidence, 0) /
          data.data_blocks.length
        : 0.7,
    blocks: botBlocksToDataBlocks(data.data_blocks),
    intent: data.intent,
    suggestions: data.suggestions,
    conversationId: data.conversation_id,
    source: 'server',
  };
}

/**
 * Local fallback (original regex + MongoDB text search)
 */
async function askLocalFallback(query: string): Promise<AskAnswer> {
  const places = await placesService.searchByText(query, 5);
  if (places.length === 0) {
    return {
      summary: '아직 충분한 데이터가 없어요. 다른 키워드로 물어봐 주세요.',
      confidence: 0.4,
      blocks: [],
      source: 'local',
    };
  }

  const { insights } = await insightsService.getInsightsForPlaces(places.map((p) => p.id));

  const wantsWait = /대기|wait/i.test(query);
  const wantsDeal = /딜|deal|쿠폰|혜택/i.test(query);
  const wantsSafety = /안전|위험|시설/i.test(query);

  let best = places[0];
  let bestScore = -Infinity;

  places.forEach((place) => {
    const ins = insights.get(place.id);
    if (!ins) return;

    const blocks = Object.values(ins).filter((b): b is DataBlock => b != null);
    const confidence = averageConfidence(blocks);
    let score = confidence;

    if (wantsWait && ins.waitTime) {
      const wait = toNumber(ins.waitTime.value);
      if (wait != null) score = 100 - wait;
    } else if (wantsDeal && ins.dealCount) {
      const deals = toNumber(ins.dealCount.value) ?? 0;
      score = deals * 10 + confidence;
    } else if (wantsSafety && ins.safetyScore) {
      const safety = toNumber(ins.safetyScore.value) ?? 0;
      score = safety * 10;
    }

    if (score > bestScore) {
      bestScore = score;
      best = place;
    }
  });

  const bestInsights = insights.get(best.id);
  const blocks = pickBlocks(bestInsights);
  const confidence = averageConfidence(blocks);

  let summary = `${best.name}이(가) 현재 조건에 가장 잘 맞아요.`;
  if (wantsWait && bestInsights?.waitTime) {
    summary = `${best.name}이(가) 현재 대기 ${bestInsights.waitTime.value}로 가장 빠른 편이에요.`;
  } else if (wantsDeal && bestInsights?.dealCount) {
    summary = `${best.name}에서 현재 ${bestInsights.dealCount.value}개의 딜이 보여요.`;
  } else if (wantsSafety && bestInsights?.safetyScore) {
    summary = `${best.name}의 안전 평가가 ${bestInsights.safetyScore.value}로 높아요.`;
  }

  return {
    summary,
    placeId: best.id,
    placeName: best.name,
    place: best,
    confidence,
    blocks,
    source: 'local',
  };
}

export function useAskEngine(query: string, childAgeMonths?: number) {
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const canUseBotQuery = useSubscriptionStore((s) => s.canUseFeature('bot_query_daily_limit'));

  const normalized = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (normalized.length < 2) {
      setAnswer(null);
      setLoading(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        // Primary: Server API (if quota available)
        if (canUseBotQuery) {
          try {
            const result = await askServerApi(normalized, childAgeMonths, conversationId);
            if (result.conversationId) setConversationId(result.conversationId);
            setAnswer(result);
            setLoading(false);
            return;
          } catch {
            // Server failed → fall through to local
          }
        }

        // Fallback: Local regex + MongoDB text search
        const localResult = await askLocalFallback(normalized);
        setAnswer(localResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : '답변을 불러오지 못했어요');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [normalized, canUseBotQuery, childAgeMonths, conversationId]);

  const resetConversation = useCallback(() => {
    setConversationId(undefined);
    setAnswer(null);
  }, []);

  return { answer, loading, error, conversationId, resetConversation };
}
