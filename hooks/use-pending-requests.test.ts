/**
 * Tests for hooks/use-pending-requests.ts
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';

import { usePendingRequests } from '@/hooks/use-pending-requests';
import type { PaymentRequest } from '@/types/payment';

jest.mock('@/services/api', () => ({
  api: jest.fn(),
  setAccessToken: jest.fn(),
  getAccessToken: jest.fn(),
  setAuthHandlers: jest.fn(),
}));

const mockApi = jest.requireMock('@/services/api').api as jest.Mock;

const FAKE_REQUESTS: PaymentRequest[] = [
  {
    id: 'abc-123',
    agent_name: 'TestAgent',
    amount_minor: 1299,
    currency: 'USD',
    merchant_name: 'Example Store',
    merchant_domain: 'example.com',
    purpose: 'Buy air filter',
    line_items: [{ name: 'Air filter', qty: 1, unit_price_minor: 1299 }],
    status: 'PENDING',
    created_at: '2026-02-15T12:00:00Z',
    expires_at: '2026-02-15T12:15:00Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usePendingRequests', () => {
  test('starts in loading state', () => {
    mockApi.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => usePendingRequests());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.requests).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('fetches requests on mount', async () => {
    mockApi.mockResolvedValue(FAKE_REQUESTS);
    const { result } = renderHook(() => usePendingRequests());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.requests).toEqual(FAKE_REQUESTS);
    expect(result.current.error).toBeNull();
    expect(mockApi).toHaveBeenCalledWith('/api/payments/pending/');
  });

  test('handles fetch error', async () => {
    mockApi.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => usePendingRequests());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.requests).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });

  test('refresh re-fetches data', async () => {
    mockApi.mockResolvedValueOnce([]).mockResolvedValueOnce(FAKE_REQUESTS);
    const { result } = renderHook(() => usePendingRequests());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests).toEqual([]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.requests).toEqual(FAKE_REQUESTS);
    expect(mockApi).toHaveBeenCalledTimes(2);
  });
});
