/**
 * Global Jest setup — mocks for native modules that aren't available in test env.
 */

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock @stripe/stripe-react-native
jest.mock('@stripe/stripe-react-native', () => ({
  StripeProvider: jest.fn(({ children }: any) => children),
  confirmPlatformPayPayment: jest.fn().mockResolvedValue({
    error: undefined,
    paymentIntent: { id: 'pi_mock', status: 'succeeded' },
  }),
  PlatformPay: {
    PaymentType: { Immediate: 'Immediate' },
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [],
  Redirect: jest.fn(() => null),
  Stack: Object.assign(jest.fn(({ children }: any) => children), {
    Screen: jest.fn(() => null),
  }),
  Tabs: Object.assign(jest.fn(({ children }: any) => children), {
    Screen: jest.fn(() => null),
  }),
  Link: jest.fn(({ children }: any) => children),
}));
