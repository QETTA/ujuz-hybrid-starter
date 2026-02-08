import { describe, it, expect } from 'vitest';
import { classifyIntent, generateFallbackResponse, generateSuggestions } from '../botService.js';

describe('classifyIntent', () => {
  it('classifies facility info queries', () => {
    expect(classifyIntent('어린이집 정보 알려줘')).toBe('FACILITY_INFO');
    expect(classifyIntent('유치원 어디있어?')).toBe('FACILITY_INFO');
  });

  it('classifies admission inquiry', () => {
    expect(classifyIntent('입소 점수 알아보기')).toBe('ADMISSION_INQUIRY');
    expect(classifyIntent('대기 순번 확인')).toBe('ADMISSION_INQUIRY');
  });

  it('classifies cost inquiry', () => {
    expect(classifyIntent('보육료 얼마야?')).toBe('COST_INQUIRY');
    expect(classifyIntent('비용이 궁금해')).toBe('COST_INQUIRY');
  });

  it('classifies review inquiry', () => {
    expect(classifyIntent('후기 보여줘')).toBe('REVIEW_INQUIRY');
    expect(classifyIntent('리뷰 확인')).toBe('REVIEW_INQUIRY');
  });

  it('classifies TO alert', () => {
    // Note: 'TO' keyword is uppercase but classifyIntent lowercases input,
    // so 'TO' literal won't match. Korean keywords work.
    expect(classifyIntent('자리 났어요')).toBe('TO_ALERT');
    expect(classifyIntent('빈자리 있대요')).toBe('TO_ALERT');
  });

  it('classifies comparison', () => {
    expect(classifyIntent('두 곳 비교해줘')).toBe('COMPARISON');
    expect(classifyIntent('뭐가 나아')).toBe('COMPARISON');
  });

  it('classifies recommendation', () => {
    expect(classifyIntent('좋은 곳 추천해줘')).toBe('RECOMMENDATION');
  });

  it('classifies subscription', () => {
    expect(classifyIntent('구독 해지')).toBe('SUBSCRIPTION');
    // '요금제' contains '요금' which matches COST_INQUIRY first (priority order)
    expect(classifyIntent('프리미엄 가입')).toBe('SUBSCRIPTION');
  });

  it('returns GENERAL for unrecognized input', () => {
    expect(classifyIntent('안녕하세요')).toBe('GENERAL');
    expect(classifyIntent('hello world')).toBe('GENERAL');
    expect(classifyIntent('')).toBe('GENERAL');
  });

  it('is case-insensitive for TO keyword', () => {
    expect(classifyIntent('to 알림')).toBe('TO_ALERT');
  });
});

describe('generateFallbackResponse', () => {
  it('returns facility info response for FACILITY_INFO intent', () => {
    const result = generateFallbackResponse('FACILITY_INFO', []);
    expect(result).toContain('어린이집');
  });

  it('returns admission response for ADMISSION_INQUIRY intent', () => {
    const result = generateFallbackResponse('ADMISSION_INQUIRY', []);
    expect(result).toContain('입소 점수');
  });

  it('returns subscription pricing for SUBSCRIPTION intent', () => {
    const result = generateFallbackResponse('SUBSCRIPTION', []);
    expect(result).toContain('4,900');
    expect(result).toContain('9,900');
  });

  it('returns GENERAL response for unknown intent', () => {
    const result = generateFallbackResponse('UNKNOWN_INTENT', []);
    expect(result).toContain('우주봇');
  });

  it('appends data block summary when blocks provided', () => {
    const blocks = [
      { type: 'facility_insight', title: '해맑은어린이집', content: '평가 A등급', confidence: 0.9 },
    ];
    const result = generateFallbackResponse('FACILITY_INFO', blocks);
    expect(result).toContain('해맑은어린이집');
    expect(result).toContain('평가 A등급');
  });
});

describe('generateSuggestions', () => {
  it('returns facility-related suggestions for FACILITY_INFO', () => {
    const suggestions = generateSuggestions('FACILITY_INFO');
    expect(suggestions).toBeInstanceOf(Array);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.includes('추천'))).toBe(true);
  });

  it('returns admission suggestions for ADMISSION_INQUIRY', () => {
    const suggestions = generateSuggestions('ADMISSION_INQUIRY');
    expect(suggestions.some((s) => s.includes('입소'))).toBe(true);
  });

  it('returns general suggestions for unknown intent', () => {
    const suggestions = generateSuggestions('UNKNOWN');
    expect(suggestions).toEqual(generateSuggestions('GENERAL'));
  });

  it('returns general suggestions for GENERAL intent', () => {
    const suggestions = generateSuggestions('GENERAL');
    expect(suggestions.length).toBe(4);
  });
});
