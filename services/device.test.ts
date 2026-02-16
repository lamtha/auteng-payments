/**
 * Tests for services/device.ts — device token storage and pairing.
 */
import * as SecureStore from 'expo-secure-store';

import {
  clearDeviceToken,
  getDeviceToken,
  hasDeviceToken,
  pairAgent,
  restoreDeviceToken,
  storeDeviceToken,
} from '@/services/device';
import { getAccessToken, setAccessToken } from '@/services/api';

// Mock config
jest.mock('@/services/config', () => ({
  Config: { apiUrl: 'http://test.local' },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  setAccessToken(null);
});

describe('getDeviceToken', () => {
  test('returns token from SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('dt_abc123');
    const token = await getDeviceToken();
    expect(token).toBe('dt_abc123');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('device_token');
  });

  test('returns null when no token stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const token = await getDeviceToken();
    expect(token).toBeNull();
  });
});

describe('storeDeviceToken', () => {
  test('saves to SecureStore and sets access token', async () => {
    await storeDeviceToken('dt_newtoken');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('device_token', 'dt_newtoken');
    expect(getAccessToken()).toBe('dt_newtoken');
  });
});

describe('clearDeviceToken', () => {
  test('removes from SecureStore and clears access token', async () => {
    setAccessToken('dt_existing');
    await clearDeviceToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('device_token');
    expect(getAccessToken()).toBeNull();
  });
});

describe('hasDeviceToken', () => {
  test('returns true when token exists', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('dt_abc');
    expect(await hasDeviceToken()).toBe(true);
  });

  test('returns false when no token', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    expect(await hasDeviceToken()).toBe(false);
  });
});

describe('restoreDeviceToken', () => {
  test('restores token and sets access token', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('dt_restored');
    const found = await restoreDeviceToken();
    expect(found).toBe(true);
    expect(getAccessToken()).toBe('dt_restored');
  });

  test('returns false when no token stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const found = await restoreDeviceToken();
    expect(found).toBe(false);
    expect(getAccessToken()).toBeNull();
  });
});

describe('pairAgent', () => {
  test('calls pair API and stores device token on first pair', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          device_token: 'dt_new',
          agent: { id: 'uuid-1', name: 'TestAgent' },
        }),
    });

    const result = await pairAgent('123456');

    expect(result.agent.name).toBe('TestAgent');
    expect(result.device_token).toBe('dt_new');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('device_token', 'dt_new');
    expect(getAccessToken()).toBe('dt_new');
  });

  test('calls pair API without storing when no device_token in response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          agent: { id: 'uuid-2', name: 'Agent2' },
        }),
    });

    setAccessToken('dt_existing');
    const result = await pairAgent('654321');

    expect(result.agent.name).toBe('Agent2');
    expect(result.device_token).toBeUndefined();
    // Should not overwrite existing token
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
