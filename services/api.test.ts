/**
 * Tests for services/api.ts — simplified API client (device token auth, no refresh).
 */
import { api, setAccessToken, setOnUnauthorized } from '@/services/api';

// Mock config
jest.mock('@/services/config', () => ({
  Config: { apiUrl: 'http://test.local' },
}));

// Track fetch calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

function jsonResponse(data: any, statusCode = 200) {
  return {
    ok: statusCode >= 200 && statusCode < 300,
    status: statusCode,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  setAccessToken(null);
  setOnUnauthorized(null);
});

describe('api', () => {
  test('successful request with device token', async () => {
    setAccessToken('dt_test-token');
    mockFetch.mockResolvedValue(jsonResponse({ data: 'ok' }));

    const result = await api('/api/test/');

    expect(result).toEqual({ data: 'ok' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://test.local/api/test/',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer dt_test-token',
        }),
      }),
    );
  });

  test('request with skipAuth omits auth header', async () => {
    setAccessToken('dt_test-token');
    mockFetch.mockResolvedValue(jsonResponse({ data: 'ok' }));

    await api('/api/test/', { skipAuth: true });

    const calledHeaders = mockFetch.mock.calls[0][1].headers;
    expect(calledHeaders.Authorization).toBeUndefined();
  });

  test('request without token omits auth header', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: 'ok' }));

    await api('/api/test/');

    const calledHeaders = mockFetch.mock.calls[0][1].headers;
    expect(calledHeaders.Authorization).toBeUndefined();
  });

  test('non-2xx response throws', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'Not found' }, 404));

    await expect(api('/api/test/')).rejects.toThrow('404');
  });

  test('500 error throws', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'Server Error' }, 500));

    await expect(api('/api/test/')).rejects.toThrow('500');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('401 calls onUnauthorized handler', async () => {
    const handler = jest.fn();
    setOnUnauthorized(handler);
    mockFetch.mockResolvedValue(jsonResponse({ error: 'Unauthorized' }, 401));

    await expect(api('/api/test/')).rejects.toThrow('401');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('401 without handler does not throw extra error', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'Unauthorized' }, 401));

    await expect(api('/api/test/')).rejects.toThrow('401');
  });
});
