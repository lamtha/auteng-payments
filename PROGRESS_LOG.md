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

---

## Phase 2.5: Remove Auth Layer + Regression Test (2026-02-16)

**Goal**: Remove Apple/Google Sign-In. The pairing code becomes identity, Apple Pay becomes the security gate. No login screen.

### Completed

**Backend:**
- Added `DeviceSession` model — tracks paired devices by hashed `dt_`-prefixed token (same pattern as agent `ak_` keys)
- Added `device_session` FK to `AgentAccount` (alongside existing `owner` FK)
- Created `DeviceTokenAuthentication` class — `dt_` prefix, SHA-256 hash lookup, returns `(DeviceUser, DeviceSession)`
- Created `POST /api/payments/agents/pair/` — takes pairing code, creates DeviceSession on first pair, returns device token + agent info
- Updated `GET /api/payments/pending/` — switched from `JWTAuthentication` to `DeviceTokenAuthentication`, filters by `device_session` instead of `owner`
- Removed `POST /api/auth/mobile/` URL route (code kept in `mobile_auth_views.py`)
- Migration `0160_device_session` applied

**Mobile:**
- Created `services/device.ts` — device token storage in SecureStore, `restoreDeviceToken()`, `pairAgent()`, `clearDeviceToken()`
- Simplified `services/api.ts` — removed 401 refresh/retry logic (device tokens don't expire), kept `setAccessToken` + auth header injection
- Created `hooks/use-device.ts` — `isPaired`, `isLoading`, `pair(code)`, `unpair()`
- Created `contexts/device-context.tsx` — `DeviceProvider` wrapping app (replaces `AuthProvider`)
- Created `app/pair-agent.tsx` — 6-digit pairing code input with auto-submit, AutEng branding, error/retry states
- Updated `app/_layout.tsx` — `DeviceProvider` + pair gate (not paired → `/pair-agent`, paired → tabs)
- Removed sign-in screen, auth service, auth hook, auth context, auth types
- Removed `expo-apple-authentication` from package.json, app.json plugins, jest-setup.ts

**Tests (70 total):**
- Backend: 34 tests (5 device auth, 7 pairing, 22 payments — 4 model, 6 agent auth, 7 create request, 5 pending list)
- Mobile: 36 tests (12 device service, 5 device hook, 5 API client, 4 pair-agent screen, 4 pending requests hook, 8 payment request card — 2 unchanged from Phase 2)
- Deleted: 22 backend auth tests (test_mobile_auth.py), 27 mobile auth tests (auth.test.ts, use-auth.test.ts, sign-in.test.tsx, old api.test.ts)

### Verified

- All 34 backend tests pass: `cd be && PROCESS_NAME=test pytest auteng/tests/test_device_auth.py auteng/tests/test_pairing.py auteng/tests/test_payments.py -v`
- All 36 mobile tests pass: `cd payments && npx jest`

### Files

```
# Backend — New
be/auteng/auth/device_auth.py                  — DeviceTokenAuthentication + DeviceUser
be/auteng/tests/test_device_auth.py            — 5 device token auth tests
be/auteng/tests/test_pairing.py                — 7 pairing endpoint tests
be/auteng/migrations/0160_device_session.py    — DeviceSession model + AgentAccount.device_session FK

# Backend — Edited
be/auteng/models/payment_models.py             — Added DeviceSession model, device_session FK on AgentAccount
be/auteng/models/__init__.py                   — Exported DeviceSession
be/auteng/view/payments_views.py               — Added pair_agent, switched list_pending_payments to device token auth
be/auteng/urls.py                              — Removed mobile_auth route, added pair_agent route
be/auteng/tests/test_payments.py               — Updated pending tests to device token auth

# Backend — Removed
be/auteng/tests/test_mobile_auth.py            — Deleted (22 Apple/Google Sign-In tests)

# Mobile — New
services/device.ts                             — Device token storage + pairing API
services/device.test.ts                        — 12 device service tests
hooks/use-device.ts                            — Device pairing state hook
hooks/use-device.test.ts                       — 5 device hook tests
contexts/device-context.tsx                    — DeviceProvider (replaces AuthProvider)
app/pair-agent.tsx                             — 6-digit pairing code screen
__tests__/app/pair-agent.test.tsx              — 4 pair-agent screen tests

# Mobile — Edited
services/api.ts                                — Removed 401 refresh/retry, simplified
services/api.test.ts                           — Rewrote for simplified API (5 tests)
app/_layout.tsx                                — DeviceProvider + pair gate (replaces AuthProvider + auth gate)
jest-setup.ts                                  — Removed expo-apple-authentication mock
package.json                                   — Removed expo-apple-authentication dependency
app.json                                       — Removed expo-apple-authentication plugin

# Mobile — Removed
app/sign-in.tsx                                — Deleted (replaced by pair-agent.tsx)
services/auth.ts                               — Deleted (replaced by device.ts)
services/auth.test.ts                          — Deleted
hooks/use-auth.ts                              — Deleted (replaced by use-device.ts)
hooks/use-auth.test.ts                         — Deleted
contexts/auth-context.tsx                      — Deleted (replaced by device-context.tsx)
types/auth.ts                                  — Deleted
__tests__/app/sign-in.test.tsx                 — Deleted
```

### Notes

- Device tokens use `dt_` prefix + 32 bytes hex (67 chars total), matching the `ak_` pattern for agent keys
- `DeviceSession.device_token_hash` stores SHA-256 of the full token — raw token is only returned once at first pairing
- `DeviceUser` is a minimal wrapper satisfying DRF's `IsAuthenticated` permission (`.is_authenticated = True`)
- Pairing is single-step for now (enter code → agent paired with default caps). Full two-step flow with cap configuration deferred to Phase 6
- `AgentAccount.owner` FK kept for future web dashboard use. Mobile auth uses `device_session` exclusively
- `mobile_auth_views.py` code kept but URL route removed — can be fully deleted once Phase 6 confirms no fallback needed

---

## Phase 2.5 Polish: Model Cleanup, Tab Removal, Paste Support, 401 Handling (2026-02-16)

**Goal**: Post-implementation cleanup — align models with new auth architecture, strip deferred UI, improve pairing UX, handle stale tokens.

### Completed

**Backend — Model cleanup:**
- Removed `AWAITING_PAYMENT` from `PaymentRequestStatus` — no intermediate state in the new flow (Apple Pay payment IS the approval)
- Changed `PaymentRequest.decided_by` FK from `AUTH_USER_MODEL` → `DeviceSession` — decisions come from paired devices, not Django users
- Added index on `['device_session', 'is_active']` for `AgentAccount` — matches the mobile query path
- Updated `AgentAccount.__str__` — shows device UUID when paired via device session
- Migration `0161_cleanup_payment_models`

**Backend — Integration test helper:**
- Created `seed_payment_flow` management command — creates agent with pairing code + API key, waits for manual pairing in simulator, creates a payment request, prints curl commands for further testing

**Mobile — Removed History & Agents tabs:**
- Deleted `app/(tabs)/history.tsx` and `app/(tabs)/agents.tsx` (placeholder screens deferred to later milestone)
- Updated `app/(tabs)/_layout.tsx` — single Pending screen, tab bar hidden

**Mobile — Paste support on pairing screen:**
- Refactored `app/pair-agent.tsx` from 6 individual TextInputs to a single hidden TextInput behind visual digit boxes
- Pasting a 6-digit code now works natively
- Added `textContentType="oneTimeCode"` for iOS clipboard suggestions
- Active digit box gets tint-colored border as cursor indicator

**Mobile — 401 stale token handling:**
- Added `setOnUnauthorized` callback to `services/api.ts` — fires on 401 responses
- Wired in `hooks/use-device.ts` — 401 triggers `clearDeviceToken()` + `setIsPaired(false)`
- App self-heals when stored device token is invalid (e.g. DB rows deleted) — redirects to pairing screen instead of looping on 401

**Tests (40 mobile):**
- 6 pair-agent screen tests (was 4 — added paste + typing tests)
- 7 API client tests (was 5 — added 401 handler tests)
- Remaining 27 unchanged

### Verified

- All 34 backend tests pass
- All 40 mobile tests pass: `cd payments && npx jest`
- Manual: seed_payment_flow → pair in simulator → payment request visible in pending list
- Manual: delete app + DB rows → reinstall → app detects stale token → redirects to pairing

### Files

```
# Backend — Edited
be/auteng/models/payment_models.py             — Removed AWAITING_PAYMENT, changed decided_by FK, added device_session index
be/auteng/migrations/0161_cleanup_payment_models.py — Migration for model cleanup

# Backend — New
be/auteng/management/commands/seed_payment_flow.py — Integration test helper for simulator testing

# Mobile — Edited
app/(tabs)/_layout.tsx                         — Single Pending screen, tab bar hidden
app/pair-agent.tsx                             — Refactored to hidden input + visual boxes (paste support)
services/api.ts                                — Added setOnUnauthorized callback, 401 detection
hooks/use-device.ts                            — Wired 401 → clearDeviceToken + unpair

# Mobile — Edited (tests)
__tests__/app/pair-agent.test.tsx              — Updated for hidden input, added paste/typing tests (6 tests)
services/api.test.ts                           — Added 401 handler tests (7 tests)

# Mobile — Deleted
app/(tabs)/history.tsx                         — Deferred to later milestone
app/(tabs)/agents.tsx                          — Deferred to later milestone
```

---

## Phase 3: Payment + Card Issuance (2026-02-16)

**Goal**: Owner taps "Pay $X.XX", pays via Apple Pay, Stripe webhook confirms payment and marks the request APPROVED. Deny flow included.

### Completed

**Backend:**
- Created `OwnerCharge` model (1:1 with PaymentRequest, tracks Stripe PaymentIntent, status lifecycle: PENDING → SUCCEEDED/FAILED/REFUNDED)
- Created `POST /api/payments/{uuid}/pay/` — creates Stripe PaymentIntent, returns client_secret for Apple Pay. Handles retry (existing OwnerCharge returns existing PI). Validates PENDING status, expiry, device ownership.
- Created `POST /api/payments/{uuid}/deny/` — marks request DENIED with decided_at/decided_by
- Created `GET /api/payments/{uuid}/status/` — owner polls for status after Apple Pay (waiting for webhook to flip APPROVED)
- Added `payment_intent.succeeded` webhook handler in `stripe_webhook_views.py` — updates OwnerCharge to SUCCEEDED, PaymentRequest to APPROVED. Idempotent on duplicate webhooks.
- Added shared `_get_payment_request_for_device()` helper for ownership validation
- Added `STRIPE_ISSUING_CARDHOLDER_ID` placeholder to Stripe settings (prep for Phase 4)
- Migration `0162_owner_charge` applied

**Mobile:**
- Installed `@stripe/stripe-react-native` with Expo config plugin (Apple Pay merchant ID, no Google Pay)
- Added `StripeProvider` wrapping entire app tree in root layout
- Created `services/payments.ts` — `payRequest()`, `denyRequest()`, `getRequestStatus()`, `pollForApproval()` (polls every 1.5s, 30s timeout)
- Created `hooks/use-payment-action.ts` — encapsulates full pay flow (create PI → Apple Pay sheet → poll for APPROVED) and deny flow. Tracks `processingRequestId` for per-card loading state.
- Updated `PaymentRequestCard` with "Pay $X.XX" primary button and "Deny" text button. Shows spinner when processing.
- Updated Pending screen — wires `usePaymentAction` into card list, dismissible error banner for action failures.
- Added `PayResponse` and `PaymentStatusResponse` types

**Tests (69 total):**
- Backend: 15 tests (2 model, 5 pay endpoint, 3 deny endpoint, 2 status endpoint, 3 webhook handler)
- Mobile: 54 tests (40 existing + 6 payments service, 4 payment action hook, 4 updated card component)

### Verified

- All 15 Phase 3 backend tests pass: `cd be && PROCESS_NAME=test pytest auteng/tests/test_payment_flow.py -v`
- All 34 existing backend tests pass (no regressions)
- All 54 mobile tests pass: `cd payments && npx jest`

### Files

```
# Backend — New
be/auteng/migrations/0162_owner_charge.py              — OwnerCharge model migration
be/auteng/tests/test_payment_flow.py                   — 15 Phase 3 tests

# Backend — Edited
be/auteng/models/payment_models.py                     — Added OwnerCharge model + OwnerChargeStatus
be/auteng/models/__init__.py                           — Exported OwnerCharge, OwnerChargeStatus
be/auteng/view/payments_views.py                       — Added pay, deny, status views + webhook handler + helper
be/auteng/view/stripe_webhook_views.py                 — Added payment_intent.succeeded routing
be/auteng/urls.py                                      — Added 3 new routes (pay, deny, status)
be/llabs/settings/stripe.py                            — Added STRIPE_ISSUING_CARDHOLDER_ID placeholder

# Mobile — New
services/payments.ts                                   — Payment API service (pay, deny, status, poll)
services/payments.test.ts                              — 6 payments service tests
hooks/use-payment-action.ts                            — Pay/deny flow hook with Apple Pay integration
hooks/use-payment-action.test.ts                       — 4 payment action hook tests

# Mobile — Edited
package.json                                           — Added @stripe/stripe-react-native
app.json                                               — Added Stripe plugin with Apple Pay merchant ID
app/_layout.tsx                                        — Added StripeProvider wrapping app tree
types/payment.ts                                       — Added PayResponse, PaymentStatusResponse
components/payment-request-card.tsx                    — Added Pay/Deny buttons, processing spinner
components/payment-request-card.test.tsx               — Updated for buttons, added 4 new tests (13 total)
app/(tabs)/index.tsx                                   — Wired usePaymentAction, error banner
jest-setup.ts                                          — Added @stripe/stripe-react-native mock
.env.example                                           — Updated with Apple Pay notes
```

### Notes

- Apple Pay requires a real device + Apple Pay sandbox setup. Simulator can only test the deny flow and UI states.
- The `pay` endpoint handles retries: if an OwnerCharge already exists for a request (e.g. user cancelled first Apple Pay attempt), it retrieves the existing PaymentIntent instead of creating a new one.
- Card issuance is **not** in Phase 3 — the webhook handler marks the request APPROVED but does not create a Stripe Issuing card. That's Phase 4.
- For local webhook testing: `stripe listen --forward-to localhost:8000/webhooks/stripe/`
- `formatAmount` was changed from a private function to a named export in payment-request-card.tsx (used by both the amount display and the Pay button label)
