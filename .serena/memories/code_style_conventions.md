# Code Style and Conventions

## TypeScript Configuration
- **Strict mode**: Enabled
- **Path aliases**: `@/*` maps to project root
- **Type safety**: Full type coverage required

## Code Style

### Naming Conventions
- **Components**: PascalCase (e.g., `PlaceCard.tsx`, `SearchBar.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useNetworkStatus`, `useIsConnected`)
- **Utilities**: camelCase (e.g., `formatDistance`, `calculateDistance`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Types/Interfaces**: PascalCase (e.g., `Place`, `PlaceWithDistance`)
- **Stores**: camelCase with "Store" suffix (e.g., `filterStore`, `placeStore`)

### File Naming
- **Components**: PascalCase with `.tsx` extension
- **Hooks**: camelCase with `.ts` extension
- **Utilities**: camelCase with `.ts` extension
- **Types**: camelCase with `.ts` extension
- **Platform-specific**: Use `.ios.tsx` or `.android.tsx` or `.kakao.tsx` suffix

### Component Structure
```typescript
// 1. Imports (React, third-party, local)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  onPress?: () => void;
}

// 3. Component definition
export function Component({ title, onPress }: ComponentProps) {
  // Hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // ...
  }, []);
  
  // Handlers
  const handlePress = () => {
    // ...
  };
  
  // Render
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
}

// 4. Styles
const styles = StyleSheet.create({
  container: {
    // ...
  },
});
```

### Import Order
1. React and React Native
2. Third-party libraries
3. Expo modules
4. Navigation
5. Local components
6. Local hooks
7. Local utilities
8. Local types
9. Local constants

### Export Style
- **Prefer named exports**: `export function Component() {}`
- **Avoid default exports** except for screens
- **Index files**: Re-export from `index.ts` for clean imports

## React/React Native Patterns

### State Management
- Use Zustand for global state
- Use useState for local component state
- Persist critical state to AsyncStorage via Zustand middleware

### Performance
- Use `React.memo()` for expensive components
- Use `useCallback()` for event handlers passed to children
- Use `useMemo()` for expensive computations
- Avoid inline functions in render for list items

### Accessibility
- Add `accessible={true}` to interactive elements
- Provide `accessibilityLabel` for all touchable elements
- Use `accessibilityRole` appropriately
- Provide `accessibilityHint` for non-obvious actions
- Use `accessibilityState` for stateful elements

### Error Handling
- Use ErrorBoundary for component errors
- Show user-friendly error messages
- Log errors for debugging
- Provide retry mechanisms

### Styling
- Use StyleSheet.create() for styles
- Define colors in constants/colors.ts
- Use spacing/layout constants
- Support dark mode where applicable

## Documentation
- Add JSDoc comments for complex functions
- Document prop types with TypeScript interfaces
- Keep README and status documents updated
- Document breaking changes
