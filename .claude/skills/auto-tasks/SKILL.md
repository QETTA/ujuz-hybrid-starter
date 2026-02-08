---
name: auto-tasks
version: 1.2.0
description: 한국어 자연어 → 자동 작업 변환
user-invocable: false
disable-model-invocation: false
context: inherit
model: haiku
tools:
  - Bash
  - Read
  - Grep
  - Glob
triggers:
  - "크롤링"
  - "빌드"
  - "화면 확인"
  - "커밋"
  - "PR"
  - "배포"
  - "테스트"
  - "실행"
updated: 2026-02-04
---

# 자동 작업 매핑 스킬

한국어 자연어 명령을 자동 작업으로 변환합니다.

## 사용법

다음 한국어 표현을 인식하면 해당 작업을 자동 실행:

---

## 크롤링/데이터 관련

| 사용자 표현 | 자동 실행 |
|------------|----------|
| "크롤링", "데이터 수집", "긁어와" | npm run crawler:all 실행 |
| "데이터 상태", "통계", "DB 확인" | MongoDB 조회 + 통계 리포트 |
| "데이터 업데이트", "전체 갱신" | 전체 파이프라인 실행 |

### 크롤링 실행 명령
```bash
# 전체 크롤러 실행
npm run crawler:all

# 개별 실행
npm run crawler:start      # 워커만
npm run crawler:scheduler  # 스케줄러만
npm run crawler:dashboard  # 대시보드만
```

---

## 앱 테스트 관련

| 사용자 표현 | 자동 실행 |
|------------|----------|
| "화면 확인", "UI 봐줘", "앱 상태" | ADB 스크린샷 + 분석 |
| "에러 확인", "로그 봐" | Metro 로그 분석 |
| "앱 실행", "앱 켜" | Expo Go 실행 |
| "에뮬레이터 켜", "폰 켜" | AVD 시작 + 부팅 대기 |
| "터치", "클릭" | 좌표 터치 실행 |
| "스크롤", "내려" | 스와이프 실행 |
| "에뮬 끄기", "폰 끄기" | AVD 종료 |

### ADB 스크린샷 명령
```bash
C:/Users/sihu2/AppData/Local/Android/Sdk/platform-tools/adb.exe -s emulator-5554 exec-out screencap -p > c:/Users/sihu2/kidsmap-mobile/screen-check.png
```

---

## 빌드/배포 관련

| 사용자 표현 | 자동 실행 |
|------------|----------|
| "빌드", "컴파일", "타입체크" | npm run typecheck && npm run lint |
| "배포", "올려줘" | eas build + vercel deploy |
| "앱스토어", "출시" | eas submit |

### 빌드 명령
```bash
npm run typecheck
npm run lint
npm run build:android
npm run build:ios
```

---

## Git 관련

| 사용자 표현 | 자동 실행 |
|------------|----------|
| "커밋", "저장해" | git add + commit |
| "PR", "풀리퀘" | PR 생성 |
| "푸시", "올려" | git push |

### Git 명령 (확인 후 실행)
```bash
git status
git add .
git commit -m "메시지"
git push origin HEAD
gh pr create --fill
```

---

## 자동 실행 원칙

1. **즉시 실행**: 명령 인식 시 확인 질문 없이 바로 실행
2. **간단 알림**: "~를 실행합니다" 형태로 알림
3. **결과 보고**: 완료 후 간결한 결과 요약
4. **자동 재시도**: 에러 시 최대 3회 재시도

$ARGUMENTS
