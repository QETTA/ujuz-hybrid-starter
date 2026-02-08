# 우쥬봇 위젯 CLI-ASK 기능 설계

> 크롤링 데이터 기반 사용자 Pain Point 정확 답변 시스템
> Last Updated: 2026-02-03

---

## 🎯 개요

### 목표
맘카페/커뮤니티에서 크롤링한 데이터를 AI 학습시켜, 우쥬봇 위젯의 CLI-ASK 기능으로 사용자의 어린이집 관련 pain point에 **정확하게** 답변

### 사용자 시나리오
```
엄마: "송파구 OO어린이집 대기 100명인데 언제 들어갈 수 있나요?"

우쥬봇 (CLI-ASK):
📊 입학 가능성 분석 결과

대기 현황:
- 현재 대기: 100번
- 우선순위 점수: 85점 (맞벌이)

예상 대기 기간: 5-6개월
입학 가능성: 65% ⭐⭐⭐

💡 실제 엄마들 경험:
- "대기 95번에서 6개월 만에 연락왔어요" (2026.01)
- "맞벌이 우선이라 생각보다 빨리 들어갔어요" (2025.12)

🔔 실시간 TO 알림 신청하기 →
```

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐
│  User Input     │  "송파 OO어린이집 대기 100명인데..."
└────────┬────────┘
         ↓
┌─────────────────┐
│  Intent Parser  │  질문 의도 파악 (입학? 비용? 안전?)
└────────┬────────┘
         ↓
┌─────────────────┐
│  Entity Extract │  어린이집명, 대기인원, 지역 추출
└────────┬────────┘
         ↓
┌─────────────────┐
│  Query Builder  │  AI Training Block 쿼리 생성
└────────┬────────┘
         ↓
┌─────────────────┐
│  AI Training    │  학습된 데이터 블록 검색
│   Data Block    │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Answer Gen     │  답변 생성 (템플릿 + GPT)
└────────┬────────┘
         ↓
┌─────────────────┐
│  Uzu Bot Reply  │  위젯으로 답변 표시
└─────────────────┘
```

---

## 🧠 Intent Parser (질문 의도 파악)

### 주요 Intent 목록
| Intent | 키워드 | 우선순위 |
|--------|--------|---------|
| `admission_possibility` | 대기, TO, 입학, 언제 | 1 (최고) |
| `cost_inquiry` | 비용, 얼마, 특별활동비 | 2 |
| `safety_check` | CCTV, 사고, 안전, 선생님 | 2 |
| `program_info` | 영어, 실외, 프로그램 | 3 |
| `development_concern` | 발달, 느린, 친구 | 3 |
| `food_allergy` | 급식, 알레르기, 식단 | 4 |
| `adaptation` | 적응, 울어요, 분리불안 | 4 |
| `general_review` | 후기, 어때요, 괜찮나요 | 5 |

### Intent 분류 로직
```typescript
interface Intent {
  primary: string;
  secondary: string[];
  confidence: number;
}

function parseIntent(userInput: string): Intent {
  const text = userInput.toLowerCase();

  // 우선순위 1: 입학 가능성
  if (/대기|TO|입학|언제|들어갈/.test(text)) {
    return {
      primary: 'admission_possibility',
      secondary: [],
      confidence: 0.95,
    };
  }

  // 우선순위 2: 비용
  if (/비용|얼마|특별활동비|돈/.test(text)) {
    return {
      primary: 'cost_inquiry',
      secondary: [],
      confidence: 0.9,
    };
  }

  // 우선순위 2: 안전
  if (/CCTV|사고|안전|선생님/.test(text)) {
    return {
      primary: 'safety_check',
      secondary: [],
      confidence: 0.9,
    };
  }

  // 복합 intent (예: 입학 + 비용)
  const intents: string[] = [];
  if (/대기|입학/.test(text)) intents.push('admission_possibility');
  if (/비용|얼마/.test(text)) intents.push('cost_inquiry');

  if (intents.length > 1) {
    return {
      primary: intents[0],
      secondary: intents.slice(1),
      confidence: 0.8,
    };
  }

  // 기본: 일반 후기
  return {
    primary: 'general_review',
    secondary: [],
    confidence: 0.5,
  };
}
```

---

## 🔍 Entity Extraction (개체명 추출)

### 추출 대상
| Entity | 예시 | 추출 패턴 |
|--------|------|----------|
| `place_name` | "송파 OO어린이집" | `\S+어린이집\|유치원` |
| `region` | "송파구", "강남구" | `\S+구\|시` |
| `waiting_count` | 100명 | `(\d+)\s*명` |
| `waiting_position` | 50번 | `(\d+)\s*번` |
| `age_months` | 24개월 | `(\d+)\s*개월` |
| `cost_amount` | 30만원 | `(\d+)\s*만\s*원` |
| `priority_type` | 맞벌이, 한부모 | `맞벌이\|한부모\|다자녀` |

### 추출 로직
```typescript
interface ExtractedEntities {
  place_name?: string;
  place_id?: string; // Supabase 매칭
  region?: string;
  waiting_count?: number;
  waiting_position?: number;
  age_months?: number;
  cost_amount?: number;
  priority_type?: string;
}

async function extractEntities(userInput: string): Promise<ExtractedEntities> {
  const entities: ExtractedEntities = {};

  // 어린이집 이름
  const placeMatch = userInput.match(/(\S+어린이집|\S+유치원)/);
  if (placeMatch) {
    entities.place_name = placeMatch[1];
    // Supabase에서 장소 ID 검색
    entities.place_id = await findPlaceId(entities.place_name);
  }

  // 지역
  const regionMatch = userInput.match(/(\S+구|\S+시)/);
  if (regionMatch) {
    entities.region = regionMatch[1];
  }

  // 대기 인원
  const waitingMatch = userInput.match(/대기\s*(\d+)\s*명/);
  if (waitingMatch) {
    entities.waiting_count = parseInt(waitingMatch[1]);
  }

  // 대기 순번
  const positionMatch = userInput.match(/(\d+)\s*번/);
  if (positionMatch) {
    entities.waiting_position = parseInt(positionMatch[1]);
  }

  // 아이 개월수
  const ageMatch = userInput.match(/(\d+)\s*개월/);
  if (ageMatch) {
    entities.age_months = parseInt(ageMatch[1]);
  }

  // 비용
  const costMatch = userInput.match(/(\d+)\s*만\s*원/);
  if (costMatch) {
    entities.cost_amount = parseInt(costMatch[1]) * 10000;
  }

  // 우선순위 유형
  if (/맞벌이/.test(userInput)) entities.priority_type = '맞벌이';
  if (/한부모/.test(userInput)) entities.priority_type = '한부모';
  if (/다자녀/.test(userInput)) entities.priority_type = '다자녀';

  return entities;
}

async function findPlaceId(placeName: string): Promise<string | undefined> {
  const { data } = await supabase
    .from('places')
    .select('id')
    .ilike('name', `%${placeName}%`)
    .limit(1)
    .single();

  return data?.id;
}
```

---

## 🗄️ Query Builder (AI 블록 검색)

### Intent별 쿼리 전략
```typescript
async function buildQuery(intent: Intent, entities: ExtractedEntities) {
  switch (intent.primary) {
    case 'admission_possibility':
      return await queryAdmissionBlocks(entities);

    case 'cost_inquiry':
      return await queryCostBlocks(entities);

    case 'safety_check':
      return await querySafetyBlocks(entities);

    default:
      return await queryGeneralBlocks(entities);
  }
}

// 입학 가능성 쿼리
async function queryAdmissionBlocks(entities: ExtractedEntities) {
  const { data: blocks } = await supabase
    .from('ai_training_blocks')
    .select('*')
    .eq('block_type', 'to_pattern')
    .eq('place_id', entities.place_id)
    .gte('confidence', 0.7)
    .order('last_updated', { ascending: false })
    .limit(1);

  // 같은 지역 유사 어린이집 데이터도 검색
  const { data: similarBlocks } = await supabase
    .from('ai_training_blocks')
    .select('*')
    .eq('block_type', 'to_pattern')
    .contains('features', { region: entities.region })
    .gte('confidence', 0.7)
    .order('source_count', { ascending: false })
    .limit(5);

  return { exact: blocks, similar: similarBlocks };
}

// 비용 쿼리
async function queryCostBlocks(entities: ExtractedEntities) {
  const { data: blocks } = await supabase
    .from('ai_training_blocks')
    .select('*')
    .eq('block_type', 'cost_breakdown')
    .eq('place_id', entities.place_id)
    .gte('confidence', 0.7)
    .limit(1);

  return { exact: blocks };
}

// 안전 쿼리
async function querySafetyBlocks(entities: ExtractedEntities) {
  const { data: blocks } = await supabase
    .from('ai_training_blocks')
    .select('*')
    .eq('block_type', 'safety_review')
    .eq('place_id', entities.place_id)
    .gte('confidence', 0.7)
    .limit(1);

  return { exact: blocks };
}
```

---

## 💬 Answer Generator (답변 생성)

### 템플릿 기반 답변
```typescript
interface AnswerTemplate {
  intent: string;
  template: (data: any) => string;
}

const answerTemplates: AnswerTemplate[] = [
  {
    intent: 'admission_possibility',
    template: (data) => `
📊 입학 가능성 분석 결과

대기 현황:
- 현재 대기: ${data.waiting_count || '?'}번
- 우선순위 점수: ${data.priority_score || '?'}점

예상 대기 기간: ${data.predicted_waiting_months}개월
입학 가능성: ${Math.round(data.admission_probability * 100)}% ${getStarRating(data.admission_probability)}

💡 실제 엄마들 경험:
${data.community_reviews.map(r => `- "${r.text}" (${r.date})`).join('\n')}

🔔 실시간 TO 알림 신청하기 →
    `.trim(),
  },
  {
    intent: 'cost_inquiry',
    template: (data) => `
💰 실제 비용 분석 결과

공식 비용: ${formatCurrency(data.official_fee)}
실제 평균: ${formatCurrency(data.actual_avg_cost)}

상세 내역:
- 기본 보육료: ${formatCurrency(data.base_fee)}
- 특별활동비: ${formatCurrency(data.special_activity_fee)}
- 준비물 비용: ${formatCurrency(data.supplies_cost)}

💡 숨은 비용:
${data.hidden_costs.map(c => `- ${c}`).join('\n')}

형제 할인: ${data.sibling_discount ? `${data.sibling_discount * 100}% (특활비 제외)` : '정보 없음'}
    `.trim(),
  },
  {
    intent: 'safety_check',
    template: (data) => `
🛡️ 안전 정보 분석 결과

안전 점수: ${data.safety_score}/100

✅ 긍정 요소:
${data.positives.map(p => `- ${p}`).join('\n')}

⚠️ 주의 사항:
${data.concerns.map(c => `- ${c}`).join('\n')}

CCTV: ${data.has_cctv ? '설치됨' : '미설치'}
부모 열람: ${data.cctv_parent_access ? '가능' : '불가'}

💡 실제 학부모 의견:
${data.community_reviews.map(r => `- "${r.text}"`).join('\n')}
    `.trim(),
  },
];

function getStarRating(probability: number): string {
  if (probability >= 0.8) return '⭐⭐⭐⭐⭐';
  if (probability >= 0.6) return '⭐⭐⭐⭐';
  if (probability >= 0.4) return '⭐⭐⭐';
  if (probability >= 0.2) return '⭐⭐';
  return '⭐';
}

function formatCurrency(amount: number): string {
  return `${(amount / 10000).toFixed(0)}만원`;
}
```

### GPT 보강 답변
```typescript
async function generateAnswer(
  intent: Intent,
  entities: ExtractedEntities,
  blocks: any[]
): Promise<string> {
  // 1. 템플릿 기반 기본 답변
  const template = answerTemplates.find(t => t.intent === intent.primary);
  if (!template || blocks.length === 0) {
    return generateFallbackAnswer(intent, entities);
  }

  const blockData = blocks[0];
  let baseAnswer = template.template(blockData.label);

  // 2. GPT로 자연스럽게 다듬기 (선택적)
  if (USE_GPT_POLISH) {
    const gptPrompt = `
다음 데이터 기반 답변을 더 자연스럽고 공감되게 다듬어주세요:

${baseAnswer}

사용자 질문: ${entities.place_name}에 대한 ${intent.primary} 관련 질문
    `;

    const gptResponse = await callGPT(gptPrompt);
    return gptResponse;
  }

  return baseAnswer;
}

// 데이터가 없을 때 fallback
function generateFallbackAnswer(intent: Intent, entities: ExtractedEntities): string {
  if (intent.primary === 'admission_possibility') {
    return `
😔 죄송합니다. ${entities.place_name}에 대한 충분한 데이터가 아직 없습니다.

대신 이렇게 해보세요:
1. 어린이집에 직접 문의 (현재 대기 인원 확인)
2. 같은 지역 맘카페에서 최신 정보 검색
3. 우리 앱에 TO 알림 신청 (자리 나면 바로 알림)

🔔 TO 알림 신청하기 →
    `.trim();
  }

  return `현재 ${entities.place_name}에 대한 정보를 수집 중입니다. 조금만 기다려주세요!`;
}
```

---

## 🚀 CLI-ASK 통합

### API Endpoint
```typescript
// POST /api/uzu-bot/ask
interface AskRequest {
  user_id: string;
  message: string;
  context?: {
    previous_intents?: string[];
    user_region?: string;
    user_priority_type?: string;
  };
}

interface AskResponse {
  answer: string;
  intent: Intent;
  entities: ExtractedEntities;
  confidence: number;
  suggested_actions?: string[];
}

export async function handleAsk(req: AskRequest): Promise<AskResponse> {
  // 1. Intent 파악
  const intent = parseIntent(req.message);

  // 2. Entity 추출
  const entities = await extractEntities(req.message);

  // 3. 컨텍스트 보강 (이전 대화 고려)
  if (req.context?.user_region && !entities.region) {
    entities.region = req.context.user_region;
  }

  // 4. AI 블록 쿼리
  const blocks = await buildQuery(intent, entities);

  // 5. 답변 생성
  const answer = await generateAnswer(intent, entities, blocks.exact || blocks.similar || []);

  // 6. 추천 액션
  const suggestedActions = getSuggestedActions(intent, entities);

  return {
    answer,
    intent,
    entities,
    confidence: intent.confidence,
    suggested_actions: suggestedActions,
  };
}

function getSuggestedActions(intent: Intent, entities: ExtractedEntities): string[] {
  if (intent.primary === 'admission_possibility') {
    return [
      '실시간 TO 알림 신청',
      '같은 지역 다른 어린이집 보기',
      '입학 가능성 체크리스트',
    ];
  }

  if (intent.primary === 'cost_inquiry') {
    return [
      '비용 비교 계산기',
      '형제 할인 시뮬레이터',
      '숨은 비용 체크리스트',
    ];
  }

  return [];
}
```

---

## 📱 위젯 UI 예시

### 질문 입력창
```
┌────────────────────────────────────┐
│  💬 어린이집 고민 상담              │
├────────────────────────────────────┤
│                                    │
│  송파구 OO어린이집 대기 100명인데  │
│  언제 들어갈 수 있나요?            │
│                                    │
│  [전송] 🔊                         │
└────────────────────────────────────┘
```

### 답변 표시
```
┌────────────────────────────────────┐
│  📊 입학 가능성 분석 결과          │
├────────────────────────────────────┤
│  대기 현황:                        │
│  - 현재 대기: 100번                │
│  - 우선순위: 85점 (맞벌이)         │
│                                    │
│  예상 대기: 5-6개월                │
│  입학 가능성: 65% ⭐⭐⭐⭐            │
│                                    │
│  💡 실제 엄마들 경험:              │
│  - "대기 95번에서 6개월..."        │
│                                    │
│  [TO 알림 신청] [비슷한 곳 보기]   │
└────────────────────────────────────┘
```

---

## 🎯 성공 기준

### 답변 정확도
- **Intent 분류 정확도**: ≥ 90%
- **Entity 추출 정확도**: ≥ 85%
- **답변 신뢰도**: ≥ 70% (confidence 기준)
- **사용자 만족도**: ≥ 4.0/5.0

### 응답 시간
- **Intent 파싱**: < 100ms
- **DB 쿼리**: < 200ms
- **답변 생성**: < 500ms
- **전체 응답**: < 1초

---

## 🚀 다음 단계

### Phase 1: 기본 ASK 기능 (1주)
- [ ] Intent Parser 구현
- [ ] Entity Extraction 구현
- [ ] Template 기반 답변 생성

### Phase 2: AI 블록 연동 (1주)
- [ ] Query Builder 구현
- [ ] Supabase ai_training_blocks 테이블 쿼리
- [ ] 답변 신뢰도 계산

### Phase 3: 위젯 통합 (1주)
- [ ] API 엔드포인트 개발
- [ ] 우쥬봇 위젯 UI 구현
- [ ] 실시간 TO 알림 연동

---

## 📝 관련 문서

| 문서 | 경로 |
|------|------|
| Pain Point 조사 | `.serena/memories/community-pain-points-research.md` |
| 데이터 정제 파이프라인 | `.serena/memories/data-refinement-pipeline.md` |
| AI 학습 블록 구조 | (다음 문서) |
