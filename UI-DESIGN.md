# Payments App — UI Design Decisions

## Component Library: gluestack-ui v3

We use **gluestack-ui v3** (stable, Sep 2025) for all UI components.

- Copy-paste component model
- Styled via NativeWind v4.1 (Tailwind CSS for React Native)
- Components live in `components/ui/` and are treated as **immutable** — customize only via theme tokens in `constants/theme.ts`, never edit component source directly
- Accessible out-of-box (built on `@react-native-aria`)

## Theming Rules

1. **Theme tokens only.** All colors, spacing scales, and typography come from `constants/theme.ts`. No hardcoded values in components.
2. **Light + dark mode.** Both themes defined in theme tokens. Components adapt via NativeWind dark mode classes.
3. **`components/ui/` is immutable.** Treat copied gluestack components as a vendored dependency. If you need custom behavior, wrap the component — don't modify the source.

## Version Targeting

| Library | Version | Notes |
|---------|---------|-------|
| gluestack-ui | **v3** (stable) | Target this. v4 is alpha — upgrade when stable. |
| NativeWind | **v4.1** | Bundled with gluestack-ui v3 |
| Expo SDK | **54** | Already in `package.json` |
| React Native | **0.81** | Already in `package.json` |

## Using the gluestack-ui v2 MCP Server

The Claude Code environment has a gluestack-ui MCP server available, but it targets **v2**. The v2→v3 migration kept APIs and theming identical — **only import paths and config changed**.

Use the MCP for:
- Discovering available components and their prop APIs
- Viewing usage examples and composition patterns
- Understanding component structure before adding

Do **not** copy import paths verbatim from MCP results — check against the [v3 migration guide](https://gluestack.io/ui/docs/guides/more/upgrade-to-v3) and use `npx gluestack-ui add <component>` to get the correct v3 source.

## Setup

```bash
cd payments
npx gluestack-ui init
npx gluestack-ui add button card input text
```

Components are copied into `components/ui/`. After init, configure theme tokens in `constants/theme.ts` to match AutEng branding.
