/**
 * UJUz - Bot Types (우주봇 AI)
 */

export type IntentType =
  | 'FACILITY_INFO'
  | 'ADMISSION_INQUIRY'
  | 'COST_INQUIRY'
  | 'REVIEW_INQUIRY'
  | 'TO_ALERT'
  | 'COMPARISON'
  | 'RECOMMENDATION'
  | 'SUBSCRIPTION'
  | 'GENERAL';

export type BotMessageRole = 'user' | 'assistant' | 'system';

export interface BotMessage {
  id: string;
  role: BotMessageRole;
  content: string;
  intent?: IntentType;
  data_blocks?: BotDataBlock[];
  created_at: string;
}

export interface BotDataBlock {
  type: 'facility' | 'score' | 'review' | 'to_alert' | 'comparison';
  title: string;
  content: string;
  confidence: number;
  source?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  messages: BotMessage[];
  created_at: string;
  updated_at: string;
}

export interface BotQueryInput {
  message: string;
  conversation_id?: string;
  context?: {
    facility_id?: string;
    child_id?: string;
    location?: { lat: number; lng: number };
  };
}

export interface BotQueryResponse {
  conversation_id: string;
  message: BotMessage;
  suggestions: string[];
}

/** Server API request (POST /api/ujuz/bot/ask) */
export interface BotApiRequest {
  query: string;
  conversation_id?: string;
  context?: {
    child_age_months: number;
    location?: { lat: number; lng: number };
  };
}

/** Server API response */
export interface BotApiResponse {
  message: string;
  intent: IntentType;
  data_blocks: BotDataBlock[];
  conversation_id: string;
  suggestions: string[];
}
