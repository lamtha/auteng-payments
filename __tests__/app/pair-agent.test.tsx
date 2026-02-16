/**
 * Tests for app/pair-agent.tsx — pair agent screen.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import PairAgentScreen from '@/app/pair-agent';

// Mock device context
const mockPair = jest.fn();
jest.mock('@/contexts/device-context', () => ({
  useDeviceContext: () => ({
    isPaired: false,
    isLoading: false,
    pair: mockPair,
    unpair: jest.fn(),
  }),
}));

// Mock useColorScheme
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PairAgentScreen', () => {
  test('renders AutEng branding', () => {
    const { getByText } = render(<PairAgentScreen />);
    expect(getByText('AutEng')).toBeTruthy();
    expect(getByText('Agent Payments')).toBeTruthy();
  });

  test('renders pairing code input', () => {
    const { getByTestId } = render(<PairAgentScreen />);
    expect(getByTestId('code-input')).toBeTruthy();
    expect(getByTestId('digit-0')).toBeTruthy();
    expect(getByTestId('digit-5')).toBeTruthy();
  });

  test('renders instructions', () => {
    const { getByText } = render(<PairAgentScreen />);
    expect(getByText(/enter the 6-digit pairing code/i)).toBeTruthy();
  });

  test('shows error on pairing failure', async () => {
    mockPair.mockRejectedValue(new Error('Invalid or expired pairing code.'));

    const { getByTestId } = render(<PairAgentScreen />);

    // Enter 6 digits to trigger auto-submit
    for (let i = 0; i < 6; i++) {
      fireEvent.changeText(getByTestId(`digit-${i}`), String(i + 1));
    }

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });
});
