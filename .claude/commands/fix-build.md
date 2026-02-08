---
name: fix-build
description: TypeScript 빌드 에러 자동 수정
allowed-tools:
  - "Bash(npm run typecheck*)"
  - "Bash(npm run lint*)"
  - "Read(*)"
  - "Edit(*)"
---

# 빌드 에러 수정

TypeScript 타입체크와 빌드 에러를 자동으로 수정합니다.

## 실행 단계

1. 타입체크 실행
```bash
npm run typecheck 2>&1 | head -100
```

2. 에러 분석 및 수정
- 각 에러 파일 읽기
- 타입 에러 원인 파악
- 수정 적용

3. 재검증
```bash
npm run typecheck
```

4. (선택) 린트 검사
```bash
npm run lint
```

$ARGUMENTS
