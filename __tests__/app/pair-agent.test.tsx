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

  test('renders pairing code input with 6 digit boxes', () => {
    const { getByTestId } = render(<PairAgentScreen />);
    expect(getByTestId('code-input')).toBeTruthy();
    expect(getByTestId('digit-0')).toBeTruthy();
    expect(getByTestId('digit-5')).toBeTruthy();
    expect(getByTestId('hidden-input')).toBeTruthy();
  });

  test('renders instructions', () => {
    const { getByText } = render(<PairAgentScreen />);
    expect(getByText(/enter the 6-digit pairing code/i)).toBeTruthy();
  });

  test('typing full code triggers pairing', async () => {
    mockPair.mockResolvedValue(undefined);

    const { getByTestId } = render(<PairAgentScreen />);

    fireEvent.changeText(getByTestId('hidden-input'), '123456');

    await waitFor(() => {
      expect(mockPair).toHaveBeenCalledWith('123456');
    });
  });

  test('pasting code triggers pairing', async () => {
    mockPair.mockResolvedValue(undefined);

    const { getByTestId } = render(<PairAgentScreen />);

    // Paste simulated as a single changeText with full code
    fireEvent.changeText(getByTestId('hidden-input'), '527739');

    await waitFor(() => {
      expect(mockPair).toHaveBeenCalledWith('527739');
    });
  });

  test('shows error on pairing failure', async () => {
    mockPair.mockRejectedValue(new Error('Invalid or expired pairing code.'));

    const { getByTestId } = render(<PairAgentScreen />);

    fireEvent.changeText(getByTestId('hidden-input'), '123456');

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });
});
