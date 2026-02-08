/**
 * UJUz - TO Alert Types
 * 어린이집 TO(자리) 알림 서비스
 */

import type { AgeClass } from './auth';

export interface TOSubscription {
  id: string;
  user_id: string;
  facility_id: string;
  facility_name: string;
  target_classes: AgeClass[];
  is_active: boolean;
  notification_preferences: NotificationPreferences;
  created_at: string;
}

export interface NotificationPreferences {
  push: boolean;
  sms: boolean;
  email: boolean;
}

export interface TOAlert {
  id: string;
  facility_id: string;
  facility_name: string;
  age_class: AgeClass;
  detected_at: string;
  estimated_slots: number;
  confidence: number;
  is_read: boolean;
  source: 'auto_detection' | 'community_report' | 'official';
}

export interface TOAlertHistory {
  alerts: TOAlert[];
  total: number;
  unread_count: number;
}

export interface WaitlistSnapshot {
  facility_id: string;
  age_class: AgeClass;
  total_capacity: number;
  current_enrolled: number;
  waitlist_count: number;
  snapshot_date: string;
  change: {
    enrolled_delta: number;
    waitlist_delta: number;
    to_detected: boolean;
  };
}
