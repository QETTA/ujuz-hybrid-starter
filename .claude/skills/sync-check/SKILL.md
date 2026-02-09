---
name: sync-check
version: 1.0.0
description: 코드-에뮬레이터 동기화 상태 확인
user-invocable: true
disable-model-invocation: false
context: fork
model: haiku
tools:
  - Bash
  - Read
triggers:
  - "동기화 확인"
  - "싱크 상태"
  - "번들 상태"
  - "sync status"
  - "metro 상태"
allowedTools:
  - "Bash(curl *)"
  - "Bash(adb *)"
  - "Bash(cat *)"
  - "Bash(tail *)"
  - "Read(*.jsonl)"
updated: 2026-02-09
---

# 코드-에뮬레이터 동기화 상태 확인

Metro 번들러의 실시간 동기화 상태를 확인합니다.

## 진단 플로우

### Step 1: Metro sync-status 엔드포인트 확인

```bash
curl -s http://localhost:8081/sync-status 2>/dev/null || echo "Metro 서버 미실행"
```

응답 필드:
- `state`: idle | bundling | synced | error
- `lastBundle`: 마지막 번들 시간 (ISO)
- `lastBundleDuration`: 번들 소요시간 (ms)
- `hmrCount`: HMR 업데이트 횟수
- `errors`: 최근 에러 목록

### Step 2: ADB logcat에서 [UJUZ_SYNC] 태그 확인

```bash
adb logcat -d -s ReactNativeJS:* | grep "[UJUZ_SYNC]" | tail -20
```

### Step 3: JSONL 로그 분석

```bash
tail -20 apps/mobile/.sync-logs/metro-sync.jsonl 2>/dev/null || echo "로그 파일 없음"
```

## 진단 결과 해석

| state | 의미 | 조치 |
|-------|------|------|
| `idle` | Metro 대기 중 | 정상 |
| `bundling` | 번들 빌드 중 | 잠시 대기 |
| `synced` | 동기화 완료 | 정상 - 에뮬레이터 반영됨 |
| `error` | 빌드 실패 | errors 배열 확인 → 코드 수정 |

## 자동 진단

1. Metro 서버 실행 여부 확인
2. 마지막 번들 시간이 30초 이내인지 확인
3. 에러가 있으면 에러 내용 분석
4. HMR 카운트로 핫 리로드 동작 여부 판단
5. 결과를 한국어로 요약 보고
