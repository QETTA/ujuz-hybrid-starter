# Codebase Structure (Monorepo)

## Directory Layout

```
ujuz-hybrid-starter/
├── apps/
│   ├── api/                    # Express backend
│   │   └── src/
│   │       ├── config/         # env, logger, mongodb
│   │       ├── middleware/     # cors, auth, rate-limit
│   │       ├── routes/         # API routes
│   │       ├── services/       # Business logic
│   │       ├── dto/            # Data Transfer Objects
│   │       └── types/          # TypeScript types
│   ├── mobile/                 # React Native + Expo
│   │   ├── app/
│   │   │   ├── components/     # Reusable UI components
│   │   │   │   ├── feed/       # Feed-related components
│   │   │   │   ├── map/        # Map-related components
│   │   │   │   ├── place/      # Place-related components
│   │   │   │   └── shared/     # Shared/common components
│   │   │   ├── constants/      # App constants (colors, layout, shadows)
│   │   │   ├── design-system/  # Design system components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── navigation/     # Navigation configuration
│   │   │   ├── screens/        # Screen components
│   │   │   ├── services/       # External services (API, location, storage)
│   │   │   ├── stores/         # Zustand state stores
│   │   │   ├── types/          # TypeScript type definitions
│   │   │   └── utils/          # Utility functions
│   │   ├── jest.config.js      # Jest configuration
│   │   ├── jest.setup.js       # Jest mocks
│   │   └── .eslintrc.js        # ESLint (RN a11y rules)
│   ├── worker-ai/              # AI processing worker
│   └── worker-alerts/          # Alert notification worker
├── packages/
│   ├── config/                 # Shared configuration
│   ├── db/                     # MongoDB client (shared)
│   └── shared/                 # Shared utilities/types
├── infra/                      # Terraform (DigitalOcean)
├── docs/                       # Project documentation
├── .claude/                    # Claude Code agents/skills/settings
├── .serena/                    # Cross-AI memories
└── .github/                    # CI/CD workflows
```

## Key Architecture Patterns

### Component Organization (Mobile)
- **Shared components**: Reusable across the app (Loading, ErrorView, OfflineBanner)
- **Domain components**: Specific to a feature area (map/, place/, feed/)
- **Screen components**: Top-level route components

### State Management (Mobile)
- **Zustand stores**: Centralized state with AsyncStorage persistence
- **Local state**: Component-level state with useState/useReducer
- **Store persistence**: FilterStore and PlaceStore persist to AsyncStorage

### Server Architecture
- **Routes**: Express router modules
- **Middleware**: Auth, CORS, rate limiting, error handling
- **Services**: Business logic layer
- **Packages**: Shared DB, config, utilities across apps

### Known Large Components (Refactoring Targets)
- **ThreeSnapBottomSheet.tsx**: 627 lines (needs splitting)
- **PlaceDetailSheet.tsx**: 562 lines (needs splitting)
- **ShortsFeedScreen.tsx**: 487 lines (needs splitting)
