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
