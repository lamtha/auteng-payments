/**
 * Tests for hooks/use-device.ts — device pairing state hook.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useDevice } from '@/hooks/use-device';

// Mock the device service
const mockRestoreDeviceToken = jest.fn();
const mockPairAgent = jest.fn();
const mockClearDeviceToken = jest.fn();

jest.mock('@/services/device', () => ({
  restoreDeviceToken: (...args: any[]) => mockRestoreDeviceToken(...args),
  pairAgent: (...args: any[]) => mockPairAgent(...args),
  clearDeviceToken: (...args: any[]) => mockClearDeviceToken(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useDevice', () => {
  test('starts in loading state', () => {
    mockRestoreDeviceToken.mockReturnValue(new Promise(() => {})); // Never resolves
    const { result } = renderHook(() => useDevice());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isPaired).toBe(false);
  });

  test('sets isPaired=true when token found on restore', async () => {
    mockRestoreDeviceToken.mockResolvedValue(true);
    const { result } = renderHook(() => useDevice());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPaired).toBe(true);
  });

  test('sets isPaired=false when no token on restore', async () => {
    mockRestoreDeviceToken.mockResolvedValue(false);
    const { result } = renderHook(() => useDevice());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPaired).toBe(false);
  });

  test('pair() calls pairAgent and sets isPaired=true', async () => {
    mockRestoreDeviceToken.mockResolvedValue(false);
    mockPairAgent.mockResolvedValue({
      device_token: 'dt_new',
      agent: { id: 'uuid', name: 'Agent' },
    });

    const { result } = renderHook(() => useDevice());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.pair('123456');
    });

    expect(mockPairAgent).toHaveBeenCalledWith('123456');
    expect(result.current.isPaired).toBe(true);
  });

  test('unpair() clears token and sets isPaired=false', async () => {
    mockRestoreDeviceToken.mockResolvedValue(true);
    mockClearDeviceToken.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDevice());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPaired).toBe(true);

    await act(async () => {
      await result.current.unpair();
    });

    expect(mockClearDeviceToken).toHaveBeenCalled();
    expect(result.current.isPaired).toBe(false);
  });
});
