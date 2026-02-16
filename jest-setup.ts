/**
 * Global Jest setup — mocks for native modules that aren't available in test env.
 */

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
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
