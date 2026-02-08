---
name: crawler
version: 1.2.0
description: 데이터 크롤링 자동화 및 모니터링
user-invocable: true
disable-model-invocation: false
context: fork
model: sonnet
tools:
  - Bash
  - Read
  - WebFetch
  - Grep
triggers:
  - "크롤링 시작"
  - "데이터 수집"
  - "크롤러 상태"
  - "큐 확인"
  - "맘맘 크롤링"
allowedTools:
  - "Bash(redis-cli *)"
  - "Bash(npm run crawler:*)"
  - "Bash(npx tsx scripts/data-migration/*)"
  - "Read(./scripts/data-migration/**)"
  - "WebFetch(domain:localhost)"
updated: 2026-02-04
---

# 크롤러 자동화 스킬

데이터 크롤링을 자동으로 실행하고 모니터링합니다.

## 트리거 표현

- "크롤링 시작", "크롤링해줘"
- "데이터 수집", "데이터 긁어와"
- "맘맘 크롤링", "장소 데이터"

---

## 자동 실행 단계

### 1. 상태 확인 (자동)

```bash
# Redis 연결 확인
redis-cli ping

# 마지막 크롤링 시간 조회
redis-cli get "crawler:lastRun"

# 현재 큐 상태
redis-cli llen "bull:crawler:wait"
redis-cli llen "bull:crawler:active"
redis-cli llen "bull:crawler:completed"
redis-cli llen "bull:crawler:failed"
```

### 2. 크롤러 실행 (자동)

```bash
# 전체 실행 (스케줄러 + 워커 + 대시보드)
npm run crawler:all
```

### 3. 모니터링 (자동)

- Bull Board 대시보드: http://localhost:3001/admin/queues
- 5분마다 진행률 보고
- 완료 시 결과 요약

---

## 개별 크롤러 명령

### 맘맘(MomMom) 크롤러
```bash
npx ts-node scripts/data-migration/mommom-crawler.ts
```

### 데이터 가져오기
```bash
npx ts-node scripts/data-migration/auto-import-all.ts
```

---

## MongoDB 통계 조회

```javascript
// MongoDB Shell 또는 Node.js
// 전체 장소 수
db.places.countDocuments({})

// 카테고리별 통계
db.places.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } }
])

// 좌표 있는 장소 수
db.places.countDocuments({ location: { $exists: true } })

// 최근 업데이트된 장소
db.places.find().sort({ updatedAt: -1 }).limit(10)
```

---

## 알림 기준

| 상황 | 알림 |
|------|------|
| 실패 작업 > 10개 | 경고 + 실패 목록 표시 |
| 데이터 7일 이상 미갱신 | 크롤링 권장 |
| 좌표 없는 데이터 > 30% | 지오코딩 권장 |

---

## 에러 처리

1. Redis 연결 실패 → 로컬 Redis 시작 또는 Azure Redis 확인
2. 크롤링 실패 → 로그 확인 후 재시도
3. MongoDB 연결 실패 → MONGODB_URI 환경변수 확인

$ARGUMENTS
