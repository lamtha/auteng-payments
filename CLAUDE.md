# Payments App — Claude Code Instructions

## Required Reading

Read these files before working in this directory:

- `README.md` — Dev setup, build workflows (simulator, device, production), EAS profiles, troubleshooting
- `CODING-STANDARDS.md` — Code style, architecture, naming conventions, SOLID/DRY guidelines, security requirements
- `UI-DESIGN.md` — Component library (gluestack-ui v3), theming rules, MCP server usage

## Key Context

- This is the **Agent Payments** mobile app (v5) — human-approved purchases via mobile, single-use virtual cards
- Expo 54 / React Native 0.81 / React 19 with Expo Router (file-based routing)
- TypeScript strict mode, `@/*` path alias for imports
- Prebuild workflow — native `ios/` and `android/` dirs are generated, not hand-edited
- Security-sensitive: handles payment approvals, requires biometric gating and secure storage
