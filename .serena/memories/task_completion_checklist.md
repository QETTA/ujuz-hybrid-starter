# Task Completion Checklist

When completing any development task, follow these steps:

## 1. Code Quality Checks

### Type Safety
- [ ] Run `npm run typecheck` - Must pass with no errors
- [ ] Ensure all new code has proper TypeScript types
- [ ] No `any` types unless absolutely necessary and documented

### Code Style
- [ ] Follow naming conventions (see code_style_conventions.md)
- [ ] Organize imports properly
- [ ] Remove unused imports and variables
- [ ] Add JSDoc comments for complex logic

### Accessibility
- [ ] Add `accessible={true}` to all interactive elements
- [ ] Provide `accessibilityLabel` for touchable components
- [ ] Use appropriate `accessibilityRole`
- [ ] Add `accessibilityHint` for non-obvious actions
- [ ] Test with VoiceOver (iOS) or TalkBack (Android) if possible

## 2. Functional Testing

### Manual Testing
- [ ] Test on iOS (simulator or device)
- [ ] Test on Android (emulator or device)
- [ ] Test with Expo Go app on real device
- [ ] Test all user flows affected by changes
- [ ] Test error scenarios

### Edge Cases
- [ ] Test with slow/no network connection
- [ ] Test with empty states
- [ ] Test with loading states
- [ ] Test with error states
- [ ] Test with extreme data (very long text, many items, etc.)

### Performance
- [ ] Check for performance issues (slow renders, lag)
- [ ] Verify no memory leaks
- [ ] Check that animations are smooth (60fps)

## 3. Integration Testing

### State Management
- [ ] Verify Zustand store updates correctly
- [ ] Check AsyncStorage persistence if applicable
- [ ] Test state synchronization across components

### API Integration
- [ ] Verify API calls work correctly
- [ ] Check error handling for failed requests
- [ ] Verify loading states during API calls

### Navigation
- [ ] Test navigation flows
- [ ] Verify back navigation works
- [ ] Check deep linking if applicable

## 4. Documentation

### Code Documentation
- [ ] Add/update JSDoc comments for new functions
- [ ] Document complex algorithms or logic
- [ ] Update type definitions if needed

### Project Documentation
- [ ] Update README.md if needed
- [ ] Update status documents (IMPLEMENTATION_STATUS.md, etc.)
- [ ] Document breaking changes
- [ ] Update CHANGELOG if exists

## 5. Git Workflow

### Before Committing
- [ ] Review all changes: `git diff`
- [ ] Stage only related changes: `git add <specific-files>`
- [ ] Run typecheck one final time: `npm run typecheck`

### Committing
- [ ] Write clear, descriptive commit message
- [ ] Use conventional commit format if applicable:
  - `feat: add new feature`
  - `fix: resolve bug`
  - `refactor: restructure code`
  - `docs: update documentation`
  - `style: format code`
  - `test: add tests`
  - `chore: maintenance tasks`

### Example Commit Messages
```bash
git commit -m "feat: add accessibility labels to PlaceCard component"
git commit -m "fix: resolve network error handling in SearchScreen"
git commit -m "refactor: extract ReviewItem into shared component"
git commit -m "perf: optimize image loading with expo-image"
```

### After Committing
- [ ] Push to remote: `git push`
- [ ] Create pull request if working on a feature branch
- [ ] Request code review if applicable

## 6. Deployment Considerations

### Development Build
- [ ] Test on development build if changes affect native code
- [ ] Verify all expo modules work correctly

### OTA Updates
- [ ] Ensure changes are OTA-compatible (no native changes)
- [ ] Test update mechanism if applicable

### Platform-Specific
- [ ] Check iOS-specific behavior
- [ ] Check Android-specific behavior
- [ ] Verify platform-specific files (.ios.tsx, .android.tsx) if used

## 7. Accessibility-Specific Checklist (for UI changes)

### Screen Reader Support
- [ ] All interactive elements are focusable
- [ ] Focus order is logical
- [ ] All images have alt text or are marked decorative
- [ ] Form inputs have labels
- [ ] Error messages are announced

### Visual Accessibility
- [ ] Color contrast meets WCAG AA standards (4.5:1 for text)
- [ ] UI works with large text sizes
- [ ] No information conveyed by color alone
- [ ] Touch targets are at least 44x44 points

### Motion and Animation
- [ ] Respect reduce motion preferences if applicable
- [ ] Animations don't cause discomfort

## 8. Performance Checklist (for large changes)

### Rendering Performance
- [ ] Use React.memo() for expensive components
- [ ] Use useCallback() for callbacks passed to children
- [ ] Use useMemo() for expensive computations
- [ ] Avoid inline functions in FlatList renderItem

### Memory Management
- [ ] Clean up subscriptions in useEffect cleanup
- [ ] Remove event listeners on unmount
- [ ] Cancel pending API requests on unmount

### Bundle Size
- [ ] No unnecessary dependencies added
- [ ] Large libraries are tree-shaken if possible
- [ ] Assets are optimized (images, fonts)

## 9. Design System Checklist

### SSOT 준수
- [ ] UI 컴포넌트는 `@/app/design-system`에서 import
- [ ] 색상은 `Colors.xxx` 토큰 사용 (하드코딩 금지)
- [ ] 그림자는 `Shadows.xxx` 사용
- [ ] 레이아웃은 `Layout.xxx` 사용

### 토큰 매핑 확인
- [ ] `#1C1C1E` → `Colors.iosLabel`
- [ ] `#F2F2F7` → `Colors.iosSecondaryBackground`
- [ ] `#8E8E93` → `Colors.iosTertiaryLabel`

### 검증 명령
```bash
# 하드코딩 색상 검출
/design-check
```

## 10. Cross-AI 협업 (Codex 피드백 시)

### 검증 프로세스
- [ ] `npm run typecheck` 실행
- [ ] 관련 파일 코드 확인
- [ ] 동의/반박 포인트 분류
- [ ] 코드 증거 기반 응답

### 피드백 수용 기준
- [ ] TypeScript 컴파일 성공
- [ ] 기존 동작 유지
- [ ] 프로젝트 컨벤션 준수
- [ ] Breaking change 없음

### 상태 업데이트
- [ ] `.serena/memories/cross-ai-shared-context.md` 작업 추적 업데이트
- [ ] 완료 작업은 "최근 완료 작업"으로 이동

### 검증 명령
```bash
/cross-ai-review
```

## Notes

- Not all items apply to every task - use judgment
- For small changes (typos, minor fixes), simplified checklist is acceptable
- For large features or refactoring, be thorough with all checks
- When in doubt, over-document rather than under-document
- Cross-AI 협업 시 항상 코드 > 의견 원칙 준수
