# Testing — AutEng Payments (Mobile)

Three levels of testing, from fastest/cheapest to slowest/most realistic.

---

## 1. Unit Tests (Jest)

Fast, offline, no device or backend required. Covers hooks, services, and components in isolation with mocked dependencies.

### Run

```bash
cd payments

# All tests
npm test

# Single file
npx jest hooks/use-payment-action.test.ts

# Watch mode
npx jest --watch
```

### Test files

| Area | File | What it covers |
|------|------|----------------|
| Hooks | `hooks/use-pending-requests.test.ts` | Fetch, loading, refresh, error states |
| Hooks | `hooks/use-device.test.ts` | Pair/unpair, token persistence |
| Hooks | `hooks/use-payment-action.test.ts` | Pay flow, deny flow, Apple Pay cancel, errors |
| Services | `services/api.test.ts` | Auth headers, 401 handling, error responses |
| Services | `services/device.test.ts` | Token storage, pairing API calls |
| Services | `services/payments.test.ts` | payRequest, denyRequest, status polling |
| Components | `components/payment-request-card.test.tsx` | Rendering, button callbacks, processing state |
| Screens | `__tests__/app/pair-agent.test.tsx` | Code input, pairing trigger, error display |

### Mocks

Global mocks in `jest-setup.ts`:
- `expo-secure-store` — in-memory token storage
- `@stripe/stripe-react-native` — StripeProvider, confirmPlatformPayPayment
- `expo-router` — navigation functions and components

Per-test mocks use `jest.mock()` for services (`@/services/api`, `@/services/payments`, etc.).

### Adding tests

Follow the existing pattern: test file lives next to the source file (e.g. `hooks/use-foo.ts` → `hooks/use-foo.test.ts`). Screen tests go in `__tests__/app/`.

---

## 2. Integration Testing (Device + Backend)

Tests the real mobile app against the local Django backend. Covers pairing, payment request display, deny flow, and (on real device) Apple Pay.

### Prerequisites

1. **Backend running** on LAN-accessible address:
   ```bash
   cd be && source activate auteng 2>/dev/null
   PROCESS_NAME=backend python manage.py runserver 0.0.0.0:8000
   ```

2. **Mobile `.env`** pointing to your Mac's LAN IP:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. **Stripe webhook forwarding** (for pay flow only):
   ```bash
   stripe listen --forward-to localhost:8000/webhooks/stripe/
   ```

### Build the app

| Target | Script | When to use |
|--------|--------|-------------|
| Simulator | `./build.sh` | Fastest iteration. Deny flow + UI only (no Apple Pay). |
| Physical device (local) | `./build-device.sh` | Full flow including Apple Pay. Requires device on same WiFi. |
| Physical device (EAS) | `./build-distribute.sh` | Builds via EAS cloud with `development` profile for internal distribution. Install via QR code. |

After building for device, start the Metro bundler so the dev client can connect:

```bash
npx expo start --dev-client
```

The device must be on the same WiFi as your Mac. If auto-discovery fails, set the host explicitly:

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=$(ipconfig getifaddr en0) npx expo start --dev-client
```

### Seed test data

Reset any previous state, then seed the pairing + payment flow:

```bash
cd be

# Clean slate
PROCESS_NAME=backend python manage.py reset_payment_data

# Interactive: creates agent, prints pairing code, waits for you to pair in the app
PROCESS_NAME=backend python manage.py seed_payment_flow

# Non-interactive: creates everything immediately (no pairing wait)
PROCESS_NAME=backend python manage.py seed_payment_flow --no-wait

# Create another payment for an existing agent (test multiple requests)
PROCESS_NAME=backend python manage.py seed_payment_flow --agent-uuid <uuid>
```

### Test scenarios

#### Pairing
1. Run `seed_payment_flow` (interactive mode)
2. In the app, enter the 6-digit pairing code
3. Press Enter in the terminal — should confirm pairing

#### Deny flow (simulator or device)
1. Seed a payment request (pair first, or use `--no-wait`)
2. Pull to refresh in the app — request appears
3. Tap "Deny" — request disappears, backend shows DENIED

#### Multiple payments on same agent
Test that a single paired agent can receive multiple payment requests:

1. Get your agent UUID (from the first `seed_payment_flow` output, or query the DB):
   ```bash
   PROCESS_NAME=backend python manage.py shell -c "
   from auteng.models import AgentAccount
   agent = AgentAccount.objects.latest('created_at')
   print(agent.uuid)
   "
   ```

2. Create a second payment request for that agent:
   ```bash
   PROCESS_NAME=backend python manage.py seed_payment_flow \
     --agent-uuid <uuid> \
     --amount 2499
   ```

3. Pull to refresh in the app — both payment requests should appear (if the first is still pending)

#### Pay flow — simulated (no Apple Pay needed)
```bash
PROCESS_NAME=backend python manage.py seed_payment_flow --simulate-pay
```
This creates an OwnerCharge and fires the webhook handler directly, bypassing Apple Pay. In Phase 4+, it also issues a Stripe Issuing virtual card (requires Stripe Issuing setup — see below).

#### Pay flow — real Apple Pay (device only)
1. Apple Pay sandbox configured in Apple Developer portal
2. `stripe listen` running for webhook forwarding (include `--events` for issuing — see below)
3. Seed a payment request, tap "Pay $X.XX" in the app
4. Confirm via Face ID / Apple Pay sheet
5. Webhook fires → backend marks APPROVED + issues card → app polls and refreshes

#### Card issuance & agent polling (Phase 4)

After the owner pays (simulated or real Apple Pay), the backend issues a Stripe Issuing virtual card. The agent can then poll for card details.

**Stripe Issuing setup (one-time, test mode):**

1. **Enable Issuing** on your Stripe test account at [dashboard.stripe.com/test/issuing/overview](https://dashboard.stripe.com/test/issuing/overview). Test mode Issuing is available immediately — no application needed.

2. **Create a cardholder** (the company-level cardholder used for all card issuance):
   ```bash
   stripe issuing cardholders create \
     --name "AutEng Inc" \
     --type company \
     -d "billing[address][line1]=123 Main St" \
     -d "billing[address][city]=San Francisco" \
     -d "billing[address][state]=CA" \
     -d "billing[address][postal_code]=94105" \
     -d "billing[address][country]=US"
   ```
   Copy the `ich_...` ID from the output.

3. **Fund the test Issuing balance** (Stripe test mode provides a Topup API):
   ```bash
   stripe topups create --amount 100000 --currency usd \
     --description "Test issuing float" \
     --source tok_bypassPending
   ```
   Wait a few seconds, then verify:
   ```bash
   stripe balance retrieve
   ```
   You should see an `issuing` available balance.

4. **Set the env var** in your backend `.env`:
   ```
   STRIPE_ISSUING_CARDHOLDER_ID=ich_...
   ```

**Webhook forwarding for Issuing events:**

The standard `stripe listen` command forwards all events. To be explicit:
```bash
stripe listen --forward-to localhost:8000/webhooks/stripe/ \
  --events payment_intent.succeeded,issuing_authorization.request,issuing_transaction.created
```

Note: `issuing_authorization.request` requires a **synchronous** response within 2 seconds. The backend returns a JSON `{"approved": true/false}` decision.

**Testing the full card flow:**

1. Seed + simulate pay:
   ```bash
   PROCESS_NAME=backend python manage.py seed_payment_flow --simulate-pay
   ```
   Output shows the issued card ID, last4, spend limit, expiry, and ledger events.

2. Agent polls for card details (use the API key from seed output):
   ```bash
   curl http://localhost:8000/api/payments/<payment_uuid>/ \
     -H "Authorization: Bearer ak_..."
   ```
   Within 5 minutes of card creation, the response includes full card details (number, CVC, expiry). After 5 minutes, only the status is returned.

3. To test the real Apple Pay → card flow on device:
   - `stripe listen` running
   - Pair agent in app, seed a payment request
   - Tap "Pay" → Apple Pay → webhook fires → card issued
   - Use the curl command above to poll as the agent

**Issuing test limitations:**

- Stripe test mode Issuing cards can't be used at real merchants
- To simulate a capture (card used at merchant), use the Stripe Dashboard: Issuing → Cards → find the card → "Create test purchase"
- Or use the Stripe API:
  ```bash
  stripe issuing transactions create_force_capture \
    --amount 1299 --currency usd \
    -d "card=ic_..." \
    -d "merchant_data[name]=Test Merchant"
  ```

### Verifying backend state

```bash
cd be && source activate auteng 2>/dev/null

# Check payment request status
PROCESS_NAME=backend python manage.py shell -c "
from auteng.models import PaymentRequest
for pr in PaymentRequest.objects.all():
    print(f'{pr.uuid}  {pr.status}  {pr.merchant_name}')
"

# Check issued cards
PROCESS_NAME=backend python manage.py shell -c "
from auteng.models import IssuedCard
for card in IssuedCard.objects.select_related('payment_request').all():
    print(f'{card.stripe_card_id}  ****{card.last4}  {card.status}  PR:{card.payment_request.uuid}')
"

# View ledger events for a payment request
PROCESS_NAME=backend python manage.py shell -c "
from auteng.models import LedgerEvent, PaymentRequest
pr = PaymentRequest.objects.latest('created_at')
for ev in pr.ledger_events.order_by('created_at'):
    print(f'{ev.event_type:20s}  {ev.created_at.strftime(\"%H:%M:%S\")}  {ev.payload}')
"
```

---

## 3. System Testing (Production-like)

Full end-to-end with production build, real Stripe keys, and deployed backend.

### Build

```bash
# Production build via EAS
./build-prod.sh
```

Uses the `production` EAS profile (`eas.json`), auto-increments version, and produces a release build.

### Checklist

- [ ] App installs and launches without dev client
- [ ] Pairing flow works against production backend
- [ ] Payment requests appear after pull-to-refresh
- [ ] Deny flow updates status correctly
- [ ] Apple Pay flow completes (real Stripe keys, real webhook endpoint)
- [ ] Card issued after Apple Pay succeeds (check admin or shell)
- [ ] Agent polling returns card details within 5-min window
- [ ] Agent polling returns no card details after 5-min window
- [ ] Session persists across app restart
- [ ] Expired requests are handled gracefully
- [ ] Ledger events trail is complete for full lifecycle

---

## Build Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| `build.sh` | `npx expo run:ios` | Local simulator build |
| `build-device.sh` | `npx expo run:ios --device` | Local build to physical device |
| `build-distribute.sh` | `npx eas-cli@latest build --profile development --platform ios` | EAS cloud build (dev client, internal distribution) |
| `build-prod.sh` | `npx eas-cli@latest build --platform ios` | EAS cloud production build |

### Clean rebuild

If the app crashes after adding a native module or changing plugin config:

```bash
rm -rf ios android
npx expo prebuild
npx expo run:ios          # simulator
npx expo run:ios --device # physical device
```

---

## Backend Test Commands

For reference — the Django backend has its own test suite:

```bash
cd be && source activate auteng 2>/dev/null

# Phase 3 payment flow tests
PROCESS_NAME=test pytest auteng/tests/test_payment_flow.py -v

# Phase 4 card issuance + agent polling tests
PROCESS_NAME=test pytest auteng/tests/test_payments_ph4.py -v

# All payment tests together
PROCESS_NAME=test pytest auteng/tests/test_payments.py auteng/tests/test_payment_flow.py auteng/tests/test_payments_ph4.py -v

# All backend tests
PROCESS_NAME=test pytest auteng/tests/ -v
```
