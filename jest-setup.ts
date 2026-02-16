/**
 * Global Jest setup — mocks for native modules that aren't available in test env.
 */

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-apple-authentication
jest.mock('expo-apple-authentication', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    signInAsync: jest.fn(),
    AppleAuthenticationScope: {
      FULL_NAME: 0,
      EMAIL: 1,
    },
    AppleAuthenticationButtonType: {
      SIGN_IN: 0,
      CONTINUE: 1,
    },
    AppleAuthenticationButtonStyle: {
      WHITE: 0,
      WHITE_OUTLINE: 1,
      BLACK: 2,
    },
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    AppleAuthenticationButton: (props: any) =>
      React.createElement(
        View,
        { testID: 'apple-sign-in-button', ...props },
        React.createElement(Text, null, 'Sign in with Apple'),
      ),
  };
});

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
