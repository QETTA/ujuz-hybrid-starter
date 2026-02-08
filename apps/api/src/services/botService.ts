/**
 * UJUz - Bot Service (우주봇)
 * Claude API 기반 AI 상담 서비스
 */

import { ObjectId } from 'mongodb';
import Anthropic from '@anthropic-ai/sdk';
import { getMongoDb, connectMongo } from '@ujuz/db';
import { env, logger } from '@ujuz/config';
import { AppError } from '@ujuz/shared';
import { calculateAdmissionScoreV1, formatBotResponse } from './admissionEngineV1.js';

// ── Claude API Client (lazy init) ───────────────────────
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

interface BotQueryInput {
  user_id: string;
  message: string;
  conversation_id?: string;
  context?: {
    facility_id?: string;
    child_id?: string;
    child_age_band?: '0' | '1' | '2' | '3' | '4' | '5';
    waiting_position?: number;
    priority_type?: 'dual_income' | 'sibling' | 'single_parent' | 'multi_child' | 'disability' | 'low_income' | 'general';
    location?: { lat: number; lng: number };
  };
}

interface BotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  data_blocks?: Array<{
    type: string;
    title: string;
    content: string;
    confidence: number;
    source?: string;
  }>;
  created_at: string;
}

const INTENT_KEYWORDS: Record<string, string[]> = {
  FACILITY_INFO: ['어린이집', '유치원', '시설', '정보', '알려줘', '어디'],
  ADMISSION_INQUIRY: ['입소', '입학', '점수', '대기', '순번', '가능성'],
  COST_INQUIRY: ['비용', '보육료', '금액', '얼마', '가격', '요금'],
  REVIEW_INQUIRY: ['후기', '리뷰', '평가', '어때', '좋아'],
  TO_ALERT: ['TO', '자리', '빈자리', '알림', '나면'],
  COMPARISON: ['비교', 'vs', '어디가', '뭐가 나아'],
  RECOMMENDATION: ['추천', '좋은', '괜찮은', '어디'],
  SUBSCRIPTION: ['구독', '프리미엄', '결제', '요금제'],
};

export function classifyIntent(message: string): string {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return intent;
    }
  }
  return 'GENERAL';
}

const getDbOrThrow = async () => {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    throw new AppError('MongoDB not configured', 503, 'mongo_not_configured');
  }
  const existing = getMongoDb();
  if (existing) return existing;
  return connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
};

async function fetchRelevantDataBlocks(intent: string, context?: BotQueryInput['context']) {
  try {
    const db = await getDbOrThrow();
    const query: Record<string, unknown> = { isActive: true };

    if (context?.facility_id) {
      query.targetId = context.facility_id;
    }

    const blockTypeMap: Record<string, string> = {
      FACILITY_INFO: 'facility_insight',
      ADMISSION_INQUIRY: 'admission_data',
      COST_INQUIRY: 'cost_data',
      REVIEW_INQUIRY: 'review_summary',
      TO_ALERT: 'to_pattern',
    };

    if (blockTypeMap[intent]) {
      query.blockType = blockTypeMap[intent];
    }

    const blocks = await db.collection('dataBlocks')
      .find(query)
      .sort({ confidence: -1 })
      .limit(5)
      .toArray();

    return blocks.map((b) => ({
      type: b.blockType as string,
      title: b.title as string,
      content: b.content as string,
      confidence: (b.confidence as number) ?? 0.7,
      source: b.source as string | undefined,
    }));
  } catch {
    return [];
  }
}

async function generateResponse(
  intent: string,
  message: string,
  dataBlocks: Array<{ type: string; title: string; content: string; confidence: number }>,
  context?: BotQueryInput['context'],
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  // V1.5.2 Admission Engine Integration
  if (intent === 'ADMISSION_INQUIRY' && context?.facility_id && context?.child_age_band) {
    try {
      const result = await calculateAdmissionScoreV1({
        facility_id: context.facility_id,
        child_age_band: context.child_age_band,
        waiting_position: context.waiting_position,
        priority_type: context.priority_type ?? 'general',
      });

      return formatBotResponse(result);
    } catch (error) {
      logger.warn({ error }, 'Admission score V1.5.2 calculation failed in bot');
      // Fallback to Claude API or hardcoded response
    }
  }

  // ── Claude API 호출 시도 ─────────────────────────────────
  const client = getAnthropicClient();
  if (client) {
    try {
      return await generateClaudeResponse(client, intent, message, dataBlocks, context, conversationHistory);
    } catch (error) {
      logger.warn({ error }, 'Claude API call failed, falling back to hardcoded response');
    }
  }

  // ── Fallback: 하드코딩 응답 ─────────────────────────────
  return generateFallbackResponse(intent, dataBlocks);
}

const SYSTEM_PROMPT = `당신은 "우주봇"입니다. 대한민국 어린이집 입소를 돕는 AI 상담사입니다.

역할:
- 어린이집/유치원 정보 안내 (위치, 시설, 보육료)
- 입소 점수 계산 및 예측 설명
- TO(충원) 알림 서비스 안내
- 보육 정책 및 지원금 안내
- 시설 비교 및 추천

규칙:
- 한국어로 답변하세요
- 친절하고 간결하게 답변하세요 (300자 이내 권장)
- 확실하지 않은 정보는 확인이 필요하다고 안내하세요
- 어린이집/보육 관련 질문이 아닌 경우 정중히 안내 범위를 설명하세요
- 개인정보(주민번호, 카드번호 등)는 절대 요청하지 마세요`;

async function generateClaudeResponse(
  client: Anthropic,
  intent: string,
  message: string,
  dataBlocks: Array<{ type: string; title: string; content: string; confidence: number }>,
  context?: BotQueryInput['context'],
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  // Build system prompt with data context
  let systemPrompt = SYSTEM_PROMPT;

  if (dataBlocks.length > 0) {
    const blockContext = dataBlocks
      .map((b) => `[${b.type}] ${b.title}: ${b.content} (신뢰도: ${(b.confidence * 100).toFixed(0)}%)`)
      .join('\n');
    systemPrompt += `\n\n참고 데이터:\n${blockContext}`;
  }

  if (context?.facility_id) {
    systemPrompt += `\n\n현재 컨텍스트: 시설 ID ${context.facility_id}`;
  }

  systemPrompt += `\n\n분류된 의도: ${intent}`;

  // Build messages array from conversation history
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  if (conversationHistory && conversationHistory.length > 0) {
    // Include last 10 messages for context window efficiency
    const recentHistory = conversationHistory.slice(-10);
    messages.push(...recentHistory);
  }

  messages.push({ role: 'user', content: message });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock?.text ?? generateFallbackResponse(intent, dataBlocks);
}

export function generateFallbackResponse(
  intent: string,
  dataBlocks: Array<{ type: string; title: string; content: string; confidence: number }>,
): string {
  const blockSummary = dataBlocks.length > 0
    ? `\n\n참고 데이터:\n${dataBlocks.map((b) => `- ${b.title}: ${b.content}`).join('\n')}`
    : '';

  const responses: Record<string, string> = {
    FACILITY_INFO: `어린이집 정보를 찾아보겠습니다. 검색어나 지역을 알려주시면 더 정확한 정보를 드릴 수 있어요.${blockSummary}`,
    ADMISSION_INQUIRY: `입소 점수를 확인해 보겠습니다. '입소 점수 예측' 기능에서 자녀 정보와 희망 시설을 입력하시면 상세한 분석 결과를 받으실 수 있어요.${blockSummary}`,
    COST_INQUIRY: `보육료 정보를 안내해 드리겠습니다. 정부 지원금과 추가 비용을 포함한 상세 안내가 필요하시면 시설명을 알려주세요.${blockSummary}`,
    REVIEW_INQUIRY: `시설 후기를 찾아보겠습니다. 특정 시설의 리뷰가 궁금하시면 시설명을 알려주세요.${blockSummary}`,
    TO_ALERT: `TO 알림 서비스를 안내해 드리겠습니다. 관심 시설의 TO 알림을 설정하면 자리가 나는 즉시 알려드려요. 설정 화면에서 시설을 추가해 보세요.${blockSummary}`,
    COMPARISON: `시설 비교를 도와드리겠습니다. 비교하고 싶은 시설들의 이름을 알려주세요.${blockSummary}`,
    RECOMMENDATION: `맞춤 추천을 해드리겠습니다. 자녀의 나이와 원하시는 지역을 알려주시면 최적의 시설을 추천해 드릴게요.${blockSummary}`,
    SUBSCRIPTION: `프리미엄 요금제를 안내해 드리겠습니다.\n\n🆓 무료: 입소 점수 1회/월, TO 알림 1개, AI 상담 5회/일\n💎 기본 (₩4,900/월): 입소 점수 5회, TO 5개, AI 30회\n👑 프리미엄 (₩9,900/월): 무제한 이용`,
    GENERAL: `안녕하세요! 우주봇이에요. 어린이집 관련 궁금한 점이 있으시면 무엇이든 물어보세요. 입소 점수, TO 알림, 시설 정보, 비용 안내 등을 도와드릴 수 있어요.${blockSummary}`,
  };

  return responses[intent] ?? responses.GENERAL;
}

export function generateSuggestions(intent: string): string[] {
  const suggestions: Record<string, string[]> = {
    FACILITY_INFO: ['근처 어린이집 추천해줘', '이 어린이집 입소 점수는?', '보육료 얼마야?'],
    ADMISSION_INQUIRY: ['입소 점수 계산해줘', 'TO 알림 설정하고 싶어', '다른 시설도 비교해줘'],
    COST_INQUIRY: ['정부 지원금 알려줘', '추가 비용은 뭐가 있어?', '비용 비교해줘'],
    TO_ALERT: ['TO 알림 설정해줘', '입소 점수 확인해줘', '추천 시설 알려줘'],
    GENERAL: ['어린이집 추천해줘', '입소 점수 알아보기', 'TO 알림 설정', '프리미엄 안내'],
  };

  return suggestions[intent] ?? suggestions.GENERAL;
}

export async function processQuery(input: BotQueryInput): Promise<{
  conversation_id: string;
  message: BotMessage;
  suggestions: string[];
}> {
  const db = await getDbOrThrow();
  const intent = classifyIntent(input.message);

  // Fetch relevant data blocks
  const dataBlocks = await fetchRelevantDataBlocks(intent, input.context);

  // Load conversation history for Claude API context
  let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  if (input.conversation_id) {
    try {
      // C2: Fixed IDOR - added user_id filter
      const existingConv = await db.collection('conversations').findOne(
        { _id: new ObjectId(input.conversation_id), user_id: input.user_id },
        { projection: { messages: { $slice: -10 } } },
      );
      if (existingConv?.messages) {
        conversationHistory = (existingConv.messages as BotMessage[]).map((m) => ({
          role: m.role,
          content: m.content,
        }));
      }
    } catch {
      // Ignore conversation load errors
    }
  }

  // Generate response
  const responseContent = await generateResponse(intent, input.message, dataBlocks, input.context, conversationHistory);
  const suggestions = generateSuggestions(intent);

  // Build messages
  const userMessage: BotMessage = {
    id: new ObjectId().toString(),
    role: 'user',
    content: input.message,
    intent,
    created_at: new Date().toISOString(),
  };

  const assistantMessage: BotMessage = {
    id: new ObjectId().toString(),
    role: 'assistant',
    content: responseContent,
    intent,
    data_blocks: dataBlocks,
    created_at: new Date().toISOString(),
  };

  // Save or update conversation
  let conversationId = input.conversation_id;

  if (conversationId) {
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $push: { messages: { $each: [userMessage, assistantMessage] } } as any,
        $set: { updated_at: new Date() },
      }
    );
  } else {
    const result = await db.collection('conversations').insertOne({
      user_id: input.user_id,
      title: input.message.slice(0, 50),
      messages: [userMessage, assistantMessage],
      created_at: new Date(),
      updated_at: new Date(),
    });
    conversationId = result.insertedId.toString();
  }

  return {
    conversation_id: conversationId,
    message: assistantMessage,
    suggestions,
  };
}

export async function getConversations(userId: string) {
  const db = await getDbOrThrow();
  const docs = await db.collection('conversations')
    .find({ user_id: userId })
    .sort({ updated_at: -1 })
    .limit(20)
    .project({ messages: { $slice: -1 }, title: 1, created_at: 1, updated_at: 1 })
    .toArray();

  return {
    conversations: docs.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title as string,
      last_message: (doc.messages as BotMessage[])?.[0]?.content ?? '',
      created_at: (doc.created_at as Date).toISOString(),
      updated_at: (doc.updated_at as Date).toISOString(),
    })),
  };
}

// C2: Fixed IDOR - added userId parameter and filtering
export async function getConversation(conversationId: string, userId: string) {
  const db = await getDbOrThrow();
  const doc = await db.collection('conversations').findOne({
    _id: new ObjectId(conversationId),
    user_id: userId, // C2: Added user_id filter to prevent IDOR
  });

  if (!doc) return null;

  return {
    id: doc._id.toString(),
    user_id: doc.user_id as string,
    title: doc.title as string,
    messages: doc.messages as BotMessage[],
    created_at: (doc.created_at as Date).toISOString(),
    updated_at: (doc.updated_at as Date).toISOString(),
  };
}

export async function deleteConversation(conversationId: string, userId: string) {
  const db = await getDbOrThrow();
  await db.collection('conversations').deleteOne({
    _id: new ObjectId(conversationId),
    user_id: userId,
  });
}
