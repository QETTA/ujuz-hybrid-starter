# 디자인 시스템 (SSOT)

## Import 규칙

```typescript
// ✅ 권장
import { Button, Card, Badge } from '@/app/design-system';
import { Colors, Layout, Shadows } from '@/app/constants';

// ❌ 금지
color: '#1C1C1E'  // → Colors.iosLabel
backgroundColor: '#F2F2F7'  // → Colors.iosSecondaryBackground
```

## 색상 토큰

| 하드코딩 | 토큰 |
|----------|------|
| `#1C1C1E` | `Colors.iosLabel` |
| `#3C3C43` | `Colors.iosSecondaryLabel` |
| `#8E8E93` | `Colors.iosTertiaryLabel` |
| `#F2F2F7` | `Colors.iosSecondaryBackground` |
| `#FF3B30` | `Colors.iosSystemRed` |
| `#FF9500` | `Colors.iosSystemOrange` |

## React Native 주의

```typescript
// ❌ Web CSS (작동 안 함)
background: 'linear-gradient(...)'

// ✅ expo-linear-gradient 사용
import { LinearGradient } from 'expo-linear-gradient';
```
