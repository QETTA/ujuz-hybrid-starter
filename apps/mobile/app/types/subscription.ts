/**
 * UJUz - Subscription & Payment Types
 * 프리미엄 구독 서비스
 */

export type PlanTier = 'free' | 'basic' | 'premium';
export type BillingCycle = 'monthly' | 'yearly';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface SubscriptionPlan {
  id: string;
  tier: PlanTier;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: PlanFeatures;
}

export interface PlanFeatures {
  admission_score_limit: number; // monthly, -1 = unlimited
  to_alert_facility_limit: number; // -1 = unlimited
  bot_query_daily_limit: number; // -1 = unlimited
  priority_support: boolean;
  ad_free: boolean;
  export_data: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  billing_cycle: BillingCycle;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  current_period_start: string;
  current_period_end: string;
  usage: SubscriptionUsage;
  created_at: string;
}

export interface SubscriptionUsage {
  admission_scores_used: number;
  to_alerts_active: number;
  bot_queries_today: number;
  last_reset: string;
}

export interface PaymentRequest {
  plan_id: string;
  billing_cycle: BillingCycle;
  payment_method: 'card' | 'bank_transfer' | 'kakao_pay' | 'naver_pay';
}

export interface PaymentResult {
  payment_id: string;
  order_id: string;
  status: PaymentStatus;
  amount: number;
  approved_at: string | null;
}

export const PLAN_LIMITS: Record<PlanTier, PlanFeatures> = {
  free: {
    admission_score_limit: 1,
    to_alert_facility_limit: 1,
    bot_query_daily_limit: 5,
    priority_support: false,
    ad_free: false,
    export_data: false,
  },
  basic: {
    admission_score_limit: 5,
    to_alert_facility_limit: 5,
    bot_query_daily_limit: 30,
    priority_support: false,
    ad_free: true,
    export_data: false,
  },
  premium: {
    admission_score_limit: -1,
    to_alert_facility_limit: -1,
    bot_query_daily_limit: -1,
    priority_support: true,
    ad_free: true,
    export_data: true,
  },
};
