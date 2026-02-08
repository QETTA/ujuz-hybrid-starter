---
name: design-check
description: 디자인 시스템 SSOT 준수 검사
allowed-tools:
  - "Grep(*)"
  - "Bash(grep *)"
  - "Read(*)"
---

# Design System Check 명령어

> `/design-check` 또는 `/dc`로 호출

## 용도

디자인 시스템 SSOT 준수 여부 검사

## 실행 내용

### 1. design-system 사용량
```bash
# import 카운트
grep -r "@/app/design-system" app/ --include="*.tsx" | wc -l
```

### 2. 하드코딩 색상 검출
```bash
# 하드코딩 색상 파일별 카운트
grep -rE "#[0-9A-Fa-f]{6}" app/ --include="*.tsx" |
  cut -d: -f1 | sort | uniq -c | sort -rn | head -10
```

### 3. 위반 사항 리포트

```markdown
## 🎨 Design System Check

### SSOT 준수율
| 지표 | 현재 | 목표 |
|------|------|------|
| design-system imports | N | 증가 |
| 하드코딩 색상 | N | 0 |

### 상위 위반 파일
| 파일 | 하드코딩 수 |
|------|------------|
| file1.tsx | N개 |
| file2.tsx | N개 |

### 권장 토큰 매핑
| 하드코딩 | 토큰 |
|----------|------|
| #1C1C1E | Colors.iosLabel |
| #F2F2F7 | Colors.iosSecondaryBackground |

### 액션
1. 상위 파일부터 마이그레이션
2. PR 전 재검사
```

## 관련 문서

- `app/constants/colors.ts` - 색상 토큰
- `app/design-system/index.ts` - UI 컴포넌트
- `CLAUDE.md` - 디자인 시스템 규칙
