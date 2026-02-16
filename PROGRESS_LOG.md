# Payments App — Progress Log

Append-only log. A new section is appended at the end of every completed phase. Do not edit or remove previous entries.

Tracking progress against [docs/v5/MVP_MOBILE_PLAN.md](../docs/v5/MVP_MOBILE_PLAN.md).

---

## Phase 0: Clean Slate & Skeleton (2026-02-15)

**Goal**: Remove example app, establish project foundation.

### Completed

- Ran `npm run reset-project`, deleted `app-example/`
- Set up 3-tab navigation skeleton (Pending, History, Agents) with placeholder screens
- Replaced Expo template assets with AutEng branding
- Set up AutEng color tokens in `constants/theme.ts` (light/dark)
- Created `services/api.ts` (fetch wrapper, auth header injection) and `services/config.ts` (EXPO_PUBLIC_* env)
- Added `.env` to `.gitignore`, created `.env.example`

### Verified

- App launches in simulator with 3 empty tabs and AutEng theming
- TypeScript compiles clean, lint passes
- Native build succeeds, app installs on iPhone 17 Pro simulator

### Files

```
app/_layout.tsx                   — Root Stack with ThemeProvider
app/(tabs)/_layout.tsx            — 3-tab layout (Pending, History, Agents)
app/(tabs)/index.tsx              — Pending screen (empty state)
app/(tabs)/history.tsx            — History screen (empty state)
app/(tabs)/agents.tsx             — Agents screen (empty state)
components/themed-text.tsx        — Theme-aware Text wrapper
components/themed-view.tsx        — Theme-aware View wrapper
components/haptic-tab.tsx         — Tab button with haptic feedback
components/ui/icon-symbol.tsx     — Material Icons fallback (Android/web)
components/ui/icon-symbol.ios.tsx — SF Symbols (iOS)
constants/theme.ts                — AutEng color tokens (light/dark)
hooks/use-color-scheme.ts         — Re-export of RN useColorScheme
hooks/use-theme-color.ts          — Theme-aware color hook
services/config.ts                — EXPO_PUBLIC_* env config
services/api.ts                   — Fetch wrapper with auth header injection
.env.example                      — Template for local env vars
.gitignore                        — Added .env
package.json                      — Removed reset-project script
```

### Notes

- Kept existing AutEng branding assets (icon.png, splash-icon.png, android icons, favicon) — already configured in app.json
- Removed React template assets (partial-react-logo.png, react-logo*.png)
- Color theme: blue tint (`#0F62FE` light / `#78A9FF` dark), semantic colors (success, danger, warning, border, secondary text/background)
- API client stores access token in-memory via `setAccessToken()` — will be wired to SecureStore in Phase 1

---

## Phase 1: Auth Vertical Slice (2026-02-15)

**Goal**: Sign in on phone, make authenticated API calls to the real backend.

### Completed

**Backend:**
- Created `POST /api/auth/mobile/` endpoint verifying native Apple/Google `id_token`s
- Apple verification: fetches JWKS from Apple, verifies RS256 JWT signature, checks iss/aud/exp claims
- Google verification: uses `google.oauth2.id_token.verify_oauth2_token`
- Get-or-create User by email, optional `full_name` on first Apple sign-in
- Returns standard auth response: `{ auth_token, refresh_token, user, source, is_new_user }`
- Added `APPLE_BUNDLE_ID` and `GOOGLE_MOBILE_CLIENT_ID` to Django settings (env vars)
- Added `cryptography` to `requirements-base.txt` for RS256 JWT verification

**Mobile:**
- Installed `expo-apple-authentication` and `expo-secure-store`
- Created auth types (`AuthUser`, `AuthTokens`, `AuthResponse`, `RefreshResponse`)
- Created auth service: `signInWithApple()`, `refreshAccessToken()`, `restoreSession()`, `storeTokens()`, `clearTokens()`
- Refresh token persisted in SecureStore, access token in memory
- Created `useAuth` hook with `isAuthenticated`, `isLoading`, `user`, `signIn`, `signOut`
- Created `AuthProvider` context wrapping entire app tree
- Created sign-in screen with AutEng branding and native Apple Sign-In button
- Updated root layout with gated navigation (authenticated → tabs, unauthenticated → sign-in)
- Added 401 automatic retry with token refresh to `api.ts` (callback pattern to avoid circular deps)
- Set up Jest with `jest-expo` preset and global mocks

**Tests (49 total):**
- Backend: 22 tests (7 Apple verification, 3 Google verification, 5 request validation, 5 response shape, 2 integration)
- Mobile: 27 tests (13 auth service, 4 API 401 retry, 6 auth hook, 4 sign-in screen)

### Verified

- All 22 backend tests pass: `cd be && PROCESS_NAME=test pytest auteng/tests/test_mobile_auth.py -v`
- All 27 mobile tests pass: `cd payments && npx jest`

### Files

```
# Backend
be/auteng/view/mobile_auth_views.py  — Mobile auth endpoint (Apple + Google)
be/auteng/urls.py                    — Added mobile_auth route
be/auteng/tests/test_mobile_auth.py  — 22 backend auth tests
be/requirements-base.txt             — Added cryptography
be/llabs/settings/core.py            — Added APPLE_BUNDLE_ID, GOOGLE_MOBILE_CLIENT_ID

# Mobile — New
types/auth.ts                        — Auth type definitions
services/auth.ts                     — Auth service (Apple Sign-In, token storage)
services/auth.test.ts                — 13 auth service tests
services/api.test.ts                 — 4 API 401 retry tests
hooks/use-auth.ts                    — Auth state hook
hooks/use-auth.test.ts               — 6 auth hook tests
contexts/auth-context.tsx            — Auth context provider
app/sign-in.tsx                      — Sign-in screen
app/sign-in.test.tsx                 — 4 sign-in screen tests
jest-setup.ts                        — Global test mocks

# Mobile — Edited
app/_layout.tsx                      — AuthProvider + gated navigation
services/api.ts                      — 401 retry with token refresh
app.json                             — Added expo-apple-authentication plugin
.env.example                         — Documented Apple Sign-In config
package.json                         — Added test deps + jest config
```

### Notes

- Used callback registration pattern (`setAuthHandlers`) to break circular dependency between `api.ts` and `auth.ts`
- Apple Sign-In uses the native system UI via `expo-apple-authentication` — no client secrets needed
- Test mocking strategy: mock Apple JWKS fetch + Google `verify_oauth2_token` at function level; generate real JWTs with test RSA keys for Apple tests
- Jest 29 required (not 30) for compatibility with `jest-expo`
- `--legacy-peer-deps` needed for npm install due to React 19 peer dep conflicts

---

## Phase 2: Pending Requests Vertical Slice (2026-02-15)

**Goal**: See a payment request on the Pending screen, created via the agent API.

### Completed

**Backend:**
- Created `AgentAccount` model (owner FK, agent_name, api_key_hash, caps, pairing fields)
- Created `PaymentRequest` model (agent_account FK, amount, merchant, status, timestamps)
- Both models use auto-incrementing integer PK with separate UUID field for API layer privacy
- Created `AgentAPIKeyAuthentication` class — `ak_` prefix distinguishes agent keys from JWT tokens, SHA-256 hash lookup, validates active + paired
- Created `POST /api/payments/` — agent creates purchase request (API key auth), validates required fields, enforces per-request and total spend caps, supports idempotency keys
- Created `GET /api/payments/pending/` — owner lists their pending requests (JWT auth)
- Created Django admin with "Generate API key" action for AgentAccount
- Created `create_test_payment_agent` management command to seed test agent with API key
- Migration `0159_payment_models` applied

**Mobile:**
- Created `PaymentRequest` and `LineItem` type definitions
- Created `usePendingRequests` hook — fetches on mount, exposes refresh for pull-to-refresh, loading/error states
- Created `PaymentRequestCard` component — displays formatted amount, merchant name/domain, purpose, countdown timer (updates every 30s, danger color when < 5 min), agent name badge
- Updated Pending screen with FlatList, RefreshControl pull-to-refresh, empty/loading/error states with retry button

**Tests (33 total):**
- Backend: 21 tests (3 model, 6 auth, 7 create request, 5 pending list)
- Mobile: 12 tests (4 hook, 8 card component)

### Verified

- All 21 backend tests pass: `cd be && PROCESS_NAME=test pytest auteng/tests/test_payments.py -v`
- All 12 mobile tests pass: `cd payments && npx jest hooks/use-pending-requests.test.ts components/payment-request-card.test.tsx`

### Files

```
# Backend — New
be/auteng/models/payment_models.py              — AgentAccount + PaymentRequest models
be/auteng/auth/__init__.py                       — Auth package init
be/auteng/auth/agent_auth.py                     — AgentAPIKeyAuthentication class
be/auteng/view/payments_views.py                 — POST /api/payments/, GET /api/payments/pending/
be/auteng/admin/payment_admin.py                 — Admin config with API key generation action
be/auteng/management/commands/create_test_payment_agent.py — Seed test agent command
be/auteng/tests/test_payments.py                 — 21 backend tests
be/auteng/migrations/0159_payment_models.py      — Migration

# Backend — Edited
be/auteng/models/__init__.py                     — Registered AgentAccount, PaymentRequest, PaymentRequestStatus
be/auteng/urls.py                                — Added /api/payments/ and /api/payments/pending/ routes
be/auteng/admin/__init__.py                      — Imported payment_admin

# Mobile — New
types/payment.ts                                 — PaymentRequest + LineItem types
hooks/use-pending-requests.ts                    — Pending requests data hook
hooks/use-pending-requests.test.ts               — 4 hook tests
components/payment-request-card.tsx              — Payment request card component
components/payment-request-card.test.tsx          — 8 card component tests

# Mobile — Edited
app/(tabs)/index.tsx                             — Pending screen with FlatList + pull-to-refresh
```

### Notes

- Agent API keys use `ak_` prefix (e.g. `ak_abc123...`) to distinguish from JWT tokens — `AgentAPIKeyAuthentication` returns `None` for non-prefixed tokens, allowing DRF to fall through to JWT auth
- Models use `BigAutoField` PK + separate `uuid` field; API responses expose UUID, never the integer PK
- Cap enforcement: per-request cap (`max_per_request_minor`) and total spend cap (`max_total_spend_minor`) checked before creating PaymentRequest
- Idempotency: duplicate `idempotency_key` returns the existing PaymentRequest instead of creating a new one
- Card countdown timer updates every 30 seconds; shows danger color when < 5 minutes remain
- To test end-to-end: `PROCESS_NAME=backend python manage.py create_test_payment_agent --owner-email <email>`, then curl POST to create a request, then open app to see it in the Pending tab

---

## Architecture Revision: Auth Removal + Payment-as-Approval (2026-02-16)

**Goal**: Simplify auth and approval model based on security analysis of the v5 threat model.

### Changes (docs only — code changes in Phase 2.5)

**Auth removal:**
- Removed Apple/Google Sign-In as a requirement. The pairing code is the identity binding, Apple Pay biometric is the security gate.
- Rationale: the agent has email access + browser automation, but cannot trigger Apple Pay on the owner's physical device. Even if an attacker intercepts the pairing code, they can only spend their own money. Full analysis in `docs/v5/VISION.md#authentication-strategy`.

**Payment-as-approval:**
- Removed separate "approve" step. The Apple Pay payment IS the approval — no `POST /approve/`, just `POST /pay/`.
- Removed `POST /finalize/` endpoint. Card issuance is now triggered by `payment_intent.succeeded` Stripe webhook, not a client callback. More secure (backend never trusts mobile client).
- Removed `AWAITING_PAYMENT` status from PaymentRequest.

**Documents updated:**
- `docs/v5/VISION.md` — Added Authentication Strategy section, updated core flow and roadmap
- `docs/v5/MVP_ARCH.md` — Updated auth strategy, API endpoints, sequence diagrams, code examples
- `docs/v5/MVP_MOBILE.md` — Replaced auth section, updated pay flow, tech stack, file layout
- `docs/v5/MVP_MOBILE_PLAN.md` — Added Phase 2.5, marked Phase 1 as superseded, updated Phase 4 and dependency graph
