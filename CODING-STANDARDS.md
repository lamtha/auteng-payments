# Payments App — Coding Standards

Standards and architectural guidelines for the AutEng Payments mobile app (Expo 54 / React Native 0.81 / React 19).

---

## Project Structure

```
app/                → Expo Router file-based routes (screens only, no business logic)
components/         → Shared UI components
components/ui/      → Primitive / design-system-level components
constants/          → Static config, theme tokens, enums
hooks/              → Custom React hooks
services/           → API clients, external integrations
lib/                → Pure utility functions, helpers
types/              → Shared TypeScript type definitions
stores/             → State management (Zustand or context)
```

### Rules

- **Screens are thin.** Route files in `app/` wire together components, hooks, and services — they do not contain business logic, API calls, or complex state management.
- **Colocation over indirection.** If a component, hook, or type is only used by one screen, colocate it in a `_components/` or `_hooks/` subfolder next to that route file. Promote to the top-level folder only when reused.
- **One component per file.** Exception: small, tightly-coupled subcomponents that are not exported.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files & folders | `kebab-case` | `transaction-card.tsx` |
| Components | `PascalCase` named exports | `export function TransactionCard()` |
| Hooks | `camelCase` with `use` prefix | `usePaymentStatus` |
| Types / Interfaces | `PascalCase` | `Transaction`, `PaymentMethod` |
| Constants | `PascalCase` for objects, `UPPER_SNAKE` for primitives | `Colors`, `MAX_RETRY_COUNT` |
| Route files | `kebab-case` per Expo Router convention | `app/payment-details.tsx` |

- Prefer **named exports** for all components and hooks. Default exports are reserved for route files (required by Expo Router).
- Suffix type-only files with `.types.ts` when colocated (e.g., `transaction-card.types.ts`).

---

## TypeScript

- **Strict mode is on** — keep it on. No `@ts-ignore` or `any` without a comment explaining why.
- Prefer `interface` for object shapes that may be extended; use `type` for unions, intersections, and mapped types.
- Define prop types inline for simple components; extract to a named type when props exceed ~5 fields or are reused.
- Use the `@/*` path alias for all imports outside the current directory. No `../../../` chains.

```tsx
// Good
import { TransactionCard } from '@/components/transaction-card';

// Bad
import { TransactionCard } from '../../../components/transaction-card';
```

---

## Components

### Functional components only

Use function declarations, not arrow-function assignments:

```tsx
// Good
export function TransactionCard({ amount, status }: TransactionCardProps) {
  return ( ... );
}

// Bad
export const TransactionCard: React.FC<TransactionCardProps> = ({ amount, status }) => {
  return ( ... );
};
```

### Props

- Destructure props in the function signature.
- Spread remaining props onto the root element when wrapping RN primitives (see `ThemedView` pattern).
- Keep prop interfaces narrow. Don't pass entire domain objects when a component only needs 2-3 fields.

### Composition over configuration

Prefer composable children over complex prop APIs:

```tsx
// Good — composable
<Card>
  <Card.Header title="Payment" />
  <Card.Body>{children}</Card.Body>
</Card>

// Avoid — prop-heavy
<Card title="Payment" body={children} headerVariant="large" showDivider />
```

### Platform-specific code

Use the `.ios.tsx` / `.android.tsx` / `.web.tsx` extension pattern (already used in `icon-symbol.ios.tsx`). Keep platform files side-by-side with a shared interface.

---

## Hooks

- Hooks encapsulate **one concern**: data fetching, animation, device API, or derived state.
- Name them descriptively: `usePaymentApproval`, not `useData`.
- Return typed objects, not arrays (unless mimicking `useState` shape):

```tsx
// Good
const { transactions, isLoading, error } = useTransactions();

// Avoid
const [transactions, isLoading, error] = useTransactions();
```

- Keep side effects (subscriptions, listeners) in hooks, not in components.

---

## State Management

- **Local state first.** Use `useState` / `useReducer` for UI-only state.
- **Lift only when needed.** Share state through context or a lightweight store (Zustand) only when multiple unrelated components need it.
- **Server state is not app state.** API data should flow through a data-fetching layer (React Query / SWR or a custom hook) with proper caching and invalidation — not stored in global state.
- Avoid prop drilling beyond 2 levels; introduce a context or store at that point.

---

## Styling

- Use the existing theming system (`Colors`, `useThemeColor`) for all color values. Never hardcode hex colors in components.
- Use `StyleSheet.create()` for static styles. Inline styles only for truly dynamic values.
- Keep styles colocated at the bottom of the component file.
- Spacing and sizing should use a consistent scale (multiples of 4 or 8).

```tsx
const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
});
```

---

## Navigation

- All routing is through **Expo Router** (file-based). No manual `navigation.navigate()` calls — use `<Link>`, `router.push()`, or `router.replace()` from `expo-router`.
- Type route params using Expo Router's typed routes.
- Modals, sheets, and overlays should be route-based where possible (`presentation: 'modal'`).

---

## Error Handling

- Catch errors at **service boundaries** (API calls, device APIs), not deep inside UI components.
- Use error boundaries for unrecoverable UI errors; use returned error state for recoverable ones.
- Always type error states in hooks: `{ data: T | null; error: Error | null; isLoading: boolean }`.
- Log errors with enough context to debug (screen name, action, relevant IDs). No silent catches.

---

## SOLID & DRY — Applied Pragmatically

### Single Responsibility

- A component renders UI. A hook manages state or effects. A service talks to external systems. Don't blur these boundaries.
- If a component file exceeds ~200 lines, it's probably doing too much — extract a hook or subcomponent.

### Open/Closed

- Build components that can be extended via props and composition without modifying their source.
- Use the `ThemedView` / `ThemedText` wrapper pattern: accept base props + theme overrides, spread the rest.

### Liskov Substitution

- Wrapper components around RN primitives (`View`, `Text`, `Pressable`) must accept and forward all props from the base type. A `ThemedView` should be usable anywhere a `View` is expected.

### Interface Segregation

- Don't make components depend on data they don't use. Pass only the fields needed, not the whole object.

### Dependency Inversion

- Components depend on hooks and types, not on concrete API clients or storage implementations. Services are injected via hooks or context, making them testable and swappable.

### DRY

- Extract duplication into a shared component or hook only after you see the same pattern **three times**. Two instances of similar code is fine — premature abstraction is worse than a little repetition.

---

## Performance

- Use `React.memo()` only when you have a measured performance problem, not as a default.
- Heavy lists must use `FlashList` or `FlatList` — never map over arrays in a `ScrollView`.
- Use `react-native-reanimated` for animations that need to run on the UI thread. Keep worklets small.
- Avoid creating new objects/arrays/functions in render. Hoist stable references or use `useMemo` / `useCallback` when passing to memoized children.
- Images must use `expo-image` (already installed) — it handles caching and progressive loading.

---

## Security

This app handles payment approvals. Security is not optional.

- **No secrets in client code.** API keys, tokens, and credentials must come from a secure backend or `expo-secure-store`. Never commit `.env` files with real credentials.
- **Validate all server responses** at the boundary before trusting the data shape.
- **Biometric / PIN gate** for payment approval actions.
- **Certificate pinning** in production builds.
- **Minimal permissions.** Only request device permissions the app actually uses.

---

## Testing

- **Unit tests** for hooks, services, and utility functions using Jest.
- **Component tests** for interactive components using React Native Testing Library.
- Test behavior, not implementation: assert what the user sees and does, not internal state.
- Name test files `*.test.ts(x)` colocated next to the source file.
- Mocks go in a `__mocks__/` directory adjacent to what they mock, or inline in the test file.

---

## Git & Code Review

- One feature or fix per branch. Small, reviewable PRs.
- Commit messages: imperative mood, concise (`Add payment confirmation screen`, not `added some stuff`).
- No commented-out code in commits. Delete it; git has history.
- Run `expo lint` before pushing. CI will catch it anyway, but save the round-trip.

---

## Import Order

Group and separate imports in this order:

```tsx
// 1. React / React Native
import { useState } from 'react';
import { View, Text } from 'react-native';

// 2. Expo / third-party libraries
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

// 3. Internal (using @/ alias)
import { TransactionCard } from '@/components/transaction-card';
import { usePaymentStatus } from '@/hooks/use-payment-status';
import { Colors } from '@/constants/theme';

// 4. Relative imports (colocated files)
import { formatAmount } from './utils';
```
