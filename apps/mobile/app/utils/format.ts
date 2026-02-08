/**
 * Formatting utilities
 */

/**
 * Format a number with Korean units (만, 억)
 */
export function formatNumber(num: number): string {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}억`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`;
  }
  return num.toLocaleString();
}

/**
 * Format date to Korean format
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date to relative time (e.g., "2일 전")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
}

/**
 * Format phone number (Korean format)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return phone;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format operating hours for display
 */
export function formatOperatingHours(hours?: {
  weekday?: string;
  saturday?: string;
  sunday?: string;
}): string {
  if (!hours) return '운영시간 정보 없음';

  const parts: string[] = [];
  if (hours.weekday) parts.push(`평일: ${hours.weekday}`);
  if (hours.saturday) parts.push(`토요일: ${hours.saturday}`);
  if (hours.sunday) parts.push(`일요일: ${hours.sunday}`);

  return parts.join('\n') || '운영시간 정보 없음';
}

/**
 * Format admission fee for display
 */
export function formatAdmissionFee(fee?: {
  isFree: boolean;
  adult?: number;
  child?: number;
  description?: string;
}): string {
  if (!fee) return '요금 정보 없음';
  if (fee.isFree) return '무료';

  const parts: string[] = [];
  if (fee.adult) parts.push(`성인: ${fee.adult.toLocaleString()}원`);
  if (fee.child) parts.push(`아동: ${fee.child.toLocaleString()}원`);
  if (fee.description) parts.push(fee.description);

  return parts.join(' / ') || '요금 정보 없음';
}
