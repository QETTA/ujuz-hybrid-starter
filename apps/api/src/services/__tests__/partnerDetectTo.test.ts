import { describe, it, expect } from 'vitest';
import { detectTo } from '../partnerService.js';

describe('detectTo — TO mention detection', () => {
  it('returns false for unrelated text', () => {
    const result = detectTo('오늘 날씨가 좋네요');
    expect(result.toMention).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it('detects "TO" keyword (case-insensitive)', () => {
    const result = detectTo('TO 났어요!');
    expect(result.toMention).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.55);
  });

  it('detects 티오 keyword', () => {
    const result = detectTo('티오 발생했대요');
    expect(result.toMention).toBe(true);
  });

  it('detects 입소 keyword', () => {
    const result = detectTo('입소 가능하대요');
    expect(result.toMention).toBe(true);
  });

  it('detects 결원 keyword', () => {
    const result = detectTo('결원 2명 났어요');
    expect(result.toMention).toBe(true);
  });

  it('detects 자리 keyword', () => {
    const result = detectTo('자리가 났다고 합니다');
    expect(result.toMention).toBe(true);
  });

  it('detects 대기 0번 pattern', () => {
    const result = detectTo('대기 0번이래요');
    expect(result.toMention).toBe(true);
  });

  // Slot extraction
  it('extracts estimated_slots from "TO 3명"', () => {
    const result = detectTo('TO 3명 났어요');
    expect(result.toMention).toBe(true);
    expect(result.confidence).toBe(0.85);
    expect(result.extracted?.estimated_slots).toBe(3);
  });

  it('extracts estimated_slots from "결원 2개"', () => {
    const result = detectTo('결원 2개 발생');
    expect(result.toMention).toBe(true);
    expect(result.extracted?.estimated_slots).toBe(2);
  });

  // Waitlist extraction
  it('extracts waiting_position from "대기 5번"', () => {
    const result = detectTo('입소 대기 5번째 순위');
    expect(result.toMention).toBe(true);
    expect(result.extracted?.waiting_position).toBe(5);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  // Age class extraction
  it('extracts age_class from "만 2세"', () => {
    const result = detectTo('입소 TO 만 2세반');
    expect(result.toMention).toBe(true);
    expect(result.extracted?.age_class).toBe('2세');
  });

  it('extracts age_class from "3세"', () => {
    const result = detectTo('자리 났다 3세');
    expect(result.toMention).toBe(true);
    expect(result.extracted?.age_class).toBe('3세');
  });

  // Combined extraction
  it('extracts multiple fields from rich text', () => {
    const result = detectTo('해맑은어린이집 TO 2명 만 1세반 대기 3번');
    expect(result.toMention).toBe(true);
    expect(result.confidence).toBe(0.85);
    expect(result.extracted?.estimated_slots).toBe(2);
    expect(result.extracted?.age_class).toBe('1세');
    expect(result.extracted?.waiting_position).toBe(3);
  });

  // Edge cases
  it('defaults estimated_slots to 1 when keyword present but no count', () => {
    const result = detectTo('TO 났어요!');
    expect(result.toMention).toBe(true);
    expect(result.extracted?.estimated_slots).toBe(1);
  });

  it('handles empty string', () => {
    const result = detectTo('');
    expect(result.toMention).toBe(false);
  });

  it('handles whitespace-heavy input', () => {
    const result = detectTo('  TO   3  명   났어요  ');
    expect(result.toMention).toBe(true);
    expect(result.extracted?.estimated_slots).toBe(3);
  });
});
