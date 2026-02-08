---
name: frontend-design
description: Create distinctive, production-grade React Native mobile interfaces with high design quality. Use this skill when the user asks to build mobile components, screens, or UI. Generates creative, polished code using UJUz design system tokens and Tamagui, avoiding generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade **React Native (Expo)** mobile interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, screen, or interface to build. They may include context about the purpose, audience, or technical constraints.

## UJUz Project Constraints

**MANDATORY**: All code must follow these project conventions:
- **Framework**: React Native + Expo (NO web HTML/CSS)
- **Styling**: Tamagui + `StyleSheet.create()` (NO Tailwind, NO CSS)
- **Colors**: `Colors.iosXxx` tokens from `@/app/constants` (NO hardcoded hex)
- **Components**: Import from `@/app/design-system` (Button, Card, Badge, etc.)
- **Layout**: `Layout` tokens from `@/app/constants` for spacing/radius
- **Shadows**: `Shadows` tokens from `@/app/constants`
- **Animations**: `react-native-reanimated` + `Animated` API (NO CSS animations)
- **Gradients**: `expo-linear-gradient` (NO CSS gradients)
- **Navigation**: Expo Router / React Navigation
- **Types**: Strict TypeScript, types in `@/app/types/*.ts`

```typescript
// ✅ Correct imports
import { Colors, Layout, Shadows } from '@/app/constants';
import { Button, Card, Badge } from '@/app/design-system';
import Animated, { FadeInDown, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// ❌ NEVER
import './styles.css';
color: '#1C1C1E'; // → Colors.iosLabel
backgroundColor: '#F2F2F7'; // → Colors.iosSecondaryBackground
```

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it? (UJUz targets parents of young children)
- **Tone**: UJUz brand is warm, trustworthy, modern. Pick direction within brand: soft/pastel, playful/toy-like, clean/minimal, premium/refined. Target audience is Korean parents (20s-30s).
- **Constraints**: React Native performance (60fps), accessibility, iOS HIG compliance.
- **Differentiation**: What makes this UNFORGETTABLE? One memorable detail per screen.

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working React Native code that is:
- Production-grade and functional on iOS/Android
- Visually striking and memorable
- Cohesive with UJUz brand identity
- Meticulously refined in every detail
- 60fps smooth with proper Reanimated usage

## Mobile Aesthetics Guidelines

Focus on:
- **Typography**: Use system fonts with intentional weight/size hierarchy. `fontSize` in multiples of 2. Bold headings (600+), light body (400). Korean text needs `lineHeight: fontSize * 1.6` for readability.
- **Color & Theme**: Use `Colors.iosXxx` tokens exclusively. Dominant brand colors with sharp accents. iOS system colors for semantic meaning (red=danger, blue=action, green=success).
- **Motion**: Use `react-native-reanimated` for all animations. `FadeInDown`, `SlideInRight` entering animations. `useAnimatedStyle` for interactive gestures. Focus on high-impact moments: screen enter animation with staggered reveals creates delight. Spring physics over linear timing.
- **Spatial Composition**: Respect safe areas. Bottom-tab aware layouts. Cards with proper `Layout.borderRadius`. Generous padding (16-24px). Visual hierarchy through elevation (`Shadows` tokens).
- **Touch & Interaction**: `PressableScale` for tactile feedback. Minimum 44px touch targets. Active states with subtle scale (0.97). Haptic feedback for key actions.
- **Depth & Elevation**: Use `Shadows` tokens for card elevation. `LinearGradient` for atmospheric backgrounds. Blur effects via `expo-blur` for overlays. Layered composition with `zIndex`.

NEVER use:
- Web CSS patterns (`display: flex` is ok in RN, but no `className`, no CSS Grid)
- Generic AI mobile aesthetics (plain white backgrounds with blue buttons)
- Hardcoded colors (always use `Colors.iosXxx` tokens)
- Heavy images where vector/gradient alternatives exist
- Nested `ScrollView` without proper `nestedScrollEnabled`

## React Native Performance Rules

- Wrap lists in `FlashList` (not `FlatList`) for large datasets
- `memo()` components that receive callback props
- `useCallback` for event handlers passed to children
- `useMemo` for expensive computations
- Avoid inline styles in render (use `StyleSheet.create`)
- Image optimization: use `expo-image` with `contentFit`

**IMPORTANT**: Match implementation complexity to the aesthetic vision while maintaining 60fps. Elaborate animations must use `useNativeDriver: true` or Reanimated worklets. Elegance comes from smooth execution.

Remember: Claude is capable of extraordinary creative mobile UI work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision — within React Native's capabilities.
