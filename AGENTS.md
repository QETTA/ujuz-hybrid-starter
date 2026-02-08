# AGENTS.md - UJUz Hybrid Starter (AI Collaboration)

This file defines how coding agents should work in this monorepo.

## Roles (Non-Negotiable)
- **Claude Code**: design decisions, architecture, final review, **all git commits/PRs**.
- **외부 AI (GPT, Copilot 등)**: implement code changes, refactors, migrations, and repetitive edits **based on an agreed plan/spec**.

If there is ambiguity, prefer asking Claude (or the user) rather than inventing product decisions.

## Project SSOT (Read First)
- Collaboration SSOT: `.serena/memories/CROSS-AI-INTEGRATED.md`
- Claude guide: `CLAUDE.md`

## Monorepo Structure
- **apps/mobile/**: React Native / Expo mobile app
- **apps/api/**: Express backend server
- **apps/worker-ai/**: AI processing worker
- **apps/worker-alerts/**: Alert notification worker
- **packages/config/**: Shared configuration
- **packages/db/**: MongoDB client
- **packages/shared/**: Shared utilities/types

## UI/Design System Rules
- Prefer importing UI components from `@/app/design-system` (mobile).
- Prefer importing tokens from `@/app/constants` (`Colors`, `Layout`, `Shadows`).
- **Never hardcode hex colors** in UI (`#RRGGBB` -> `Colors.xxx` token).
- React Native: **no Web CSS** (e.g., `linear-gradient(...)`, `boxShadow` strings). Use RN-compatible APIs.

## Quality Gates (Before Handing Off)
- Run `npm run typecheck:all` and keep **0 TypeScript errors**.
- Run `npm run lint` (or at minimum ensure new code is lint-clean).
- Keep UI text **Korean** for user-facing strings unless the screen is explicitly English-only.

## Safety / Ops Guardrails
- Do not read or write secrets (`.env*`, keys, tokens).
- Do not run network downloaders (`curl`, `wget`) unless explicitly requested.
- Avoid destructive git operations (`reset --hard`, `clean -fdx`, force push).
