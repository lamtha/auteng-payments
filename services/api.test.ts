/**
 * Tests for services/api.ts — 401 retry with token refresh.
 */
import { api, setAccessToken, setAuthHandlers } from '@/services/api';

// Mock config
jest.mock('@/services/config', () => ({
  Config: { apiUrl: 'http://test.local' },
}));

// Track fetch calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockRefresh = jest.fn();
const mockClear = jest.fn();

function jsonResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  setAccessToken('test-token');
  mockClear.mockResolvedValue(undefined);
  // Register auth handlers
  setAuthHandlers(mockRefresh, mockClear);
});

describe('api — 401 retry', () => {
  test('401 triggers token refresh and retries request', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ data: 'success' }));
    mockRefresh.mockResolvedValue(true);

    const result = await api('/api/test/');

    expect(result).toEqual({ data: 'success' });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('401 refresh fails clears tokens and throws', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'Unauthorized' }, 401));
    mockRefresh.mockResolvedValue(false);

    await expect(api('/api/test/')).rejects.toThrow('401');
    expect(mockClear).toHaveBeenCalled();
  });

  test('401 retries only once (no infinite loop)', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'Unauthorized' }, 401));
    mockRefresh.mockResolvedValue(true);

    await expect(api('/api/test/')).rejects.toThrow('401');
    // First request + one retry = 2 fetches
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('non-401 errors are not retried', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'Server Error' }, 500));

    await expect(api('/api/test/')).rejects.toThrow('500');
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
