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
  FACILITY_INFO: ['\uc5b4\ub9b0\uc774\uc9d1', '\uc720\uce58\uc6d0', '\uc2dc\uc124', '\uc815\ubcf4', '\uc54c\ub824\uc918', '\uc5b4\ub514'],
  ADMISSION_INQUIRY: ['\uc785\uc18c', '\uc785\ud559', '\uc810\uc218', '\ub300\uae30', '\uc21c\ubc88', '\uac00\ub2a5\uc131'],
  COST_INQUIRY: ['\ube44\uc6a9', '\ubcf4\uc721\ub8cc', '\uae08\uc561', '\uc5bc\ub9c8', '\uac00\uaca9', '\uc694\uae08'],
  REVIEW_INQUIRY: ['\ud6c4\uae30', '\ub9ac\ubdf0', '\ud3c9\uac00', '\uc5b4\ub54c', '\uc88b\uc544'],
  TO_ALERT: ['TO', '\uc790\ub9ac', '\ube48\uc790\ub9ac', '\uc54c\ub9bc', '\ub098\uba74'],
  COMPARISON: ['\ube44\uad50', 'vs', '\uc5b4\ub514\uac00', '\ubb50\uac00 \ub098\uc544'],
  RECOMMENDATION: ['\ucd94\ucc9c', '\uc88b\uc740', '\uad1c\ucc2e\uc740', '\uc5b4\ub514'],
  SUBSCRIPTION: ['\uad6c\ub3c5', '\ud504\ub9ac\ubbf8\uc5c4', '\uacb0\uc81c', '\uc694\uae08\uc81c'],
};

function classifyIntent(message: string): string {
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

const SYSTEM_PROMPT = `\ub2f9\uc2e0\uc740 "\uc6b0\uc96c\ubd07"\uc785\ub2c8\ub2e4. \ub300\ud55c\ubbfc\uad6d \uc5b4\ub9b0\uc774\uc9d1 \uc785\uc18c\ub97c \ub3d5\ub294 AI \uc0c1\ub2f4\uc0ac\uc785\ub2c8\ub2e4.

\uc5ed\ud560:
- \uc5b4\ub9b0\uc774\uc9d1/\uc720\uce58\uc6d0 \uc815\ubcf4 \uc548\ub0b4 (\uc704\uce58, \uc2dc\uc124, \ubcf4\uc721\ub8cc)
- \uc785\uc18c \uc810\uc218 \uacc4\uc0b0 \ubc0f \uc608\uce21 \uc124\uba85
- TO(\ucda9\uc6d0) \uc54c\ub9bc \uc11c\ube44\uc2a4 \uc548\ub0b4
- \ubcf4\uc721 \uc815\ucc45 \ubc0f \uc9c0\uc6d0\uae08 \uc548\ub0b4
- \uc2dc\uc124 \ube44\uad50 \ubc0f \ucd94\ucc9c

\uaddc\uce59:
- \ud55c\uad6d\uc5b4\ub85c \ub2f5\ubcc0\ud558\uc138\uc694
- \uce5c\uc808\ud558\uace0 \uac04\uacb0\ud558\uac8c \ub2f5\ubcc0\ud558\uc138\uc694 (300\uc790 \uc774\ub0b4 \uad8c\uc7a5)
- \ud655\uc2e4\ud558\uc9c0 \uc54a\uc740 \uc815\ubcf4\ub294 \ud655\uc778\uc774 \ud544\uc694\ud558\ub2e4\uace0 \uc548\ub0b4\ud558\uc138\uc694
- \uc5b4\ub9b0\uc774\uc9d1/\ubcf4\uc721 \uad00\ub828 \uc9c8\ubb38\uc774 \uc544\ub2cc \uacbd\uc6b0 \uc815\uc911\ud788 \uc548\ub0b4 \ubc94\uc704\ub97c \uc124\uba85\ud558\uc138\uc694
- \uac1c\uc778\uc815\ubcf4(\uc8fc\ubbfc\ubc88\ud638, \uce74\ub4dc\ubc88\ud638 \ub4f1)\ub294 \uc808\ub300 \uc694\uccad\ud558\uc9c0 \ub9c8\uc138\uc694`;

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
      .map((b) => `[${b.type}] ${b.title}: ${b.content} (\uc2e0\ub8b0\ub3c4: ${(b.confidence * 100).toFixed(0)}%)`)
      .join('\n');
    systemPrompt += `\n\n\ucc38\uace0 \ub370\uc774\ud130:\n${blockContext}`;
  }

  if (context?.facility_id) {
    systemPrompt += `\n\n\ud604\uc7ac \ucee8\ud14d\uc2a4\ud2b8: \uc2dc\uc124 ID ${context.facility_id}`;
  }

  systemPrompt += `\n\n\ubd84\ub958\ub41c \uc758\ub3c4: ${intent}`;

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

function generateFallbackResponse(
  intent: string,
  dataBlocks: Array<{ type: string; title: string; content: string; confidence: number }>,
): string {
  const blockSummary = dataBlocks.length > 0
    ? `\n\n\ucc38\uace0 \ub370\uc774\ud130:\n${dataBlocks.map((b) => `- ${b.title}: ${b.content}`).join('\n')}`
    : '';

  const responses: Record<string, string> = {
    FACILITY_INFO: `\uc5b4\ub9b0\uc774\uc9d1 \uc815\ubcf4\ub97c \ucc3e\uc544\ubcf4\uaca0\uc2b5\ub2c8\ub2e4. \uac80\uc0c9\uc5b4\ub098 \uc9c0\uc5ed\uc744 \uc54c\ub824\uc8fc\uc2dc\uba74 \ub354 \uc815\ud655\ud55c \uc815\ubcf4\ub97c \ub4dc\ub9b4 \uc218 \uc788\uc5b4\uc694.${blockSummary}`,
    ADMISSION_INQUIRY: `\uc785\uc18c \uc810\uc218\ub97c \ud655\uc778\ud574 \ubcf4\uaca0\uc2b5\ub2c8\ub2e4. '\uc785\uc18c \uc810\uc218 \uc608\uce21' \uae30\ub2a5\uc5d0\uc11c \uc790\ub140 \uc815\ubcf4\uc640 \ud76c\ub9dd \uc2dc\uc124\uc744 \uc785\ub825\ud558\uc2dc\uba74 \uc0c1\uc138\ud55c \ubd84\uc11d \uacb0\uacfc\ub97c \ubc1b\uc73c\uc2e4 \uc218 \uc788\uc5b4\uc694.${blockSummary}`,
    COST_INQUIRY: `\ubcf4\uc721\ub8cc \uc815\ubcf4\ub97c \uc548\ub0b4\ud574 \ub4dc\ub9ac\uaca0\uc2b5\ub2c8\ub2e4. \uc815\ubd80 \uc9c0\uc6d0\uae08\uacfc \ucd94\uac00 \ube44\uc6a9\uc744 \ud3ec\ud568\ud55c \uc0c1\uc138 \uc548\ub0b4\uac00 \ud544\uc694\ud558\uc2dc\uba74 \uc2dc\uc124\uba85\uc744 \uc54c\ub824\uc8fc\uc138\uc694.${blockSummary}`,
    REVIEW_INQUIRY: `\uc2dc\uc124 \ud6c4\uae30\ub97c \ucc3e\uc544\ubcf4\uaca0\uc2b5\ub2c8\ub2e4. \ud2b9\uc815 \uc2dc\uc124\uc758 \ub9ac\ubdf0\uac00 \uad81\uae08\ud558\uc2dc\uba74 \uc2dc\uc124\uba85\uc744 \uc54c\ub824\uc8fc\uc138\uc694.${blockSummary}`,
    TO_ALERT: `TO \uc54c\ub9bc \uc11c\ube44\uc2a4\ub97c \uc548\ub0b4\ud574 \ub4dc\ub9ac\uaca0\uc2b5\ub2c8\ub2e4. \uad00\uc2ec \uc2dc\uc124\uc758 TO \uc54c\ub9bc\uc744 \uc124\uc815\ud558\uba74 \uc790\ub9ac\uac00 \ub098\ub294 \uc989\uc2dc \uc54c\ub824\ub4dc\ub824\uc694. \uc124\uc815 \ud654\uba74\uc5d0\uc11c \uc2dc\uc124\uc744 \ucd94\uac00\ud574 \ubcf4\uc138\uc694.${blockSummary}`,
    COMPARISON: `\uc2dc\uc124 \ube44\uad50\ub97c \ub3c4\uc640\ub4dc\ub9ac\uaca0\uc2b5\ub2c8\ub2e4. \ube44\uad50\ud558\uace0 \uc2f6\uc740 \uc2dc\uc124\ub4e4\uc758 \uc774\ub984\uc744 \uc54c\ub824\uc8fc\uc138\uc694.${blockSummary}`,
    RECOMMENDATION: `\ub9de\ucda4 \ucd94\ucc9c\uc744 \ud574\ub4dc\ub9ac\uaca0\uc2b5\ub2c8\ub2e4. \uc790\ub140\uc758 \ub098\uc774\uc640 \uc6d0\ud558\uc2dc\ub294 \uc9c0\uc5ed\uc744 \uc54c\ub824\uc8fc\uc2dc\uba74 \ucd5c\uc801\uc758 \uc2dc\uc124\uc744 \ucd94\ucc9c\ud574 \ub4dc\ub9b4\uac8c\uc694.${blockSummary}`,
    SUBSCRIPTION: `\ud504\ub9ac\ubbf8\uc5c4 \uc694\uae08\uc81c\ub97c \uc548\ub0b4\ud574 \ub4dc\ub9ac\uaca0\uc2b5\ub2c8\ub2e4.\n\n\ud83c\udd93 \ubb34\ub8cc: \uc785\uc18c \uc810\uc218 1\ud68c/\uc6d4, TO \uc54c\ub9bc 1\uac1c, AI \uc0c1\ub2f4 5\ud68c/\uc77c\n\ud83d\udc8e \uae30\ubcf8 (\u20a94,900/\uc6d4): \uc785\uc18c \uc810\uc218 5\ud68c, TO 5\uac1c, AI 30\ud68c\n\ud83d\udc51 \ud504\ub9ac\ubbf8\uc5c4 (\u20a99,900/\uc6d4): \ubb34\uc81c\ud55c \uc774\uc6a9`,
    GENERAL: `\uc548\ub155\ud558\uc138\uc694! \uc6b0\uc96c\ubd07\uc774\uc5d0\uc694. \uc5b4\ub9b0\uc774\uc9d1 \uad00\ub828 \uad81\uae08\ud55c \uc810\uc774 \uc788\uc73c\uc2dc\uba74 \ubb34\uc5c7\uc774\ub4e0 \ubb3c\uc5b4\ubcf4\uc138\uc694. \uc785\uc18c \uc810\uc218, TO \uc54c\ub9bc, \uc2dc\uc124 \uc815\ubcf4, \ube44\uc6a9 \uc548\ub0b4 \ub4f1\uc744 \ub3c4\uc640\ub4dc\ub9b4 \uc218 \uc788\uc5b4\uc694.${blockSummary}`,
  };

  return responses[intent] ?? responses.GENERAL;
}

function generateSuggestions(intent: string): string[] {
  const suggestions: Record<string, string[]> = {
    FACILITY_INFO: ['\uadfc\ucc98 \uc5b4\ub9b0\uc774\uc9d1 \ucd94\ucc9c\ud574\uc918', '\uc774 \uc5b4\ub9b0\uc774\uc9d1 \uc785\uc18c \uc810\uc218\ub294?', '\ubcf4\uc721\ub8cc \uc5bc\ub9c8\uc57c?'],
    ADMISSION_INQUIRY: ['\uc785\uc18c \uc810\uc218 \uacc4\uc0b0\ud574\uc918', 'TO \uc54c\ub9bc \uc124\uc815\ud558\uace0 \uc2f6\uc5b4', '\ub2e4\ub978 \uc2dc\uc124\ub3c4 \ube44\uad50\ud574\uc918'],
    COST_INQUIRY: ['\uc815\ubd80 \uc9c0\uc6d0\uae08 \uc54c\ub824\uc918', '\ucd94\uac00 \ube44\uc6a9\uc740 \ubb50\uac00 \uc788\uc5b4?', '\ube44\uc6a9 \ube44\uad50\ud574\uc918'],
    TO_ALERT: ['TO \uc54c\ub9bc \uc124\uc815\ud574\uc918', '\uc785\uc18c \uc810\uc218 \ud655\uc778\ud574\uc918', '\ucd94\ucc9c \uc2dc\uc124 \uc54c\ub824\uc918'],
    GENERAL: ['\uc5b4\ub9b0\uc774\uc9d1 \ucd94\ucc9c\ud574\uc918', '\uc785\uc18c \uc810\uc218 \uc54c\uc544\ubcf4\uae30', 'TO \uc54c\ub9bc \uc124\uc815', '\ud504\ub9ac\ubbf8\uc5c4 \uc548\ub0b4'],
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
      const existingConv = await db.collection('conversations').findOne(
        { _id: new ObjectId(input.conversation_id) },
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

export async function getConversation(conversationId: string) {
  const db = await getDbOrThrow();
  const doc = await db.collection('conversations').findOne({
    _id: new ObjectId(conversationId),
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
