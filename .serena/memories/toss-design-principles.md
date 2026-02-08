# 토스 디자인 원칙 (Toss Design Stack)

> 설계/디자인 작업 시 항상 질문: "토스라면 어떻게 작업할까?"

---

## 핵심 원칙

### 1. 극단적 미니멀리즘
- **텍스트 최소화**: 아이콘 + 핵심 숫자만
- **여백 극대화**: 콘텐츠보다 여백이 많아야 함
- **1페이지 1기능**: 한 화면에 하나만 집중

### 2. 타이포그래피
- 큰 숫자: 24-32px, 굵게 (금액, 카운트)
- 레이블: 12-13px, 회색 (보조 설명)
- 타이틀: 16-18px, 진한 검정 (핵심 정보)
- **자간 -0.3~-0.5**: 촘촘하게 (토스 특유의 느낌)

### 3. 색상
- 배경: 순백 #FFFFFF 또는 연회색 #F2F4F6
- 텍스트: 진회색 #191F28 (검정 아님)
- 보조: #4E5968, #8B95A1
- 포인트: 토스블루 #3182F6 (아주 제한적으로)

### 4. 카드 & 컴포넌트
- 둥근 모서리: 12-16px
- 그림자: 아주 연하게 (opacity 0.06-0.08)
- 테두리: 없음 (그림자로 분리감)
- 패딩: 넉넉하게 16-20px

### 5. 인터랙션
- 터치 시 scale: 0.97-0.98 (미세하게)
- 햅틱: Light (대부분), Medium (중요 액션만)
- 애니메이션: spring (bouncy 아님, smooth)
- 지속시간: 200-300ms (빠르게)

### 6. 정보 구조
- **숫자 우선**: 금액, 개수, 퍼센트가 눈에 띄게
- **상태 표시**: 뱃지, 점(dot)으로 간결하게
- **계층 분리**: 배경색 차이로 구분 (테두리 X)

---

## 체크리스트

설계할 때 확인:
- [ ] 텍스트를 더 줄일 수 있나?
- [ ] 아이콘으로 대체 가능한가?
- [ ] 숫자가 충분히 크고 눈에 띄는가?
- [ ] 여백이 충분한가?
- [ ] 색상이 3개 이하인가?
- [ ] 그림자가 연한가?
- [ ] 터치 피드백이 미세한가?

---

## 참고 예시

```typescript
// Toss-style Button
<PressableScale
  style={{
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#3182F6',
    borderRadius: 12,
  }}
  hapticType="light"
  scaleValue={0.97}
>
  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
    버튼 텍스트
  </Text>
</PressableScale>

// Toss-style Card
<View style={{
  padding: 16,
  backgroundColor: '#fff',
  borderRadius: 16,
  ...Shadows.sm, // opacity 0.08
}}>
  <Text style={{ fontSize: 24, fontWeight: '700', color: '#191F28' }}>
    12,500원
  </Text>
  <Text style={{ fontSize: 13, color: '#8B95A1', marginTop: 4 }}>
    이번 달 사용 금액
  </Text>
</View>
```

---

Last Updated: 2026-02-03
