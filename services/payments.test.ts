/**
 * Tests for services/payments.ts
 */
import { payRequest, denyRequest, getRequestStatus, pollForApproval } from '@/services/payments';
import { api } from '@/services/api';

jest.mock('@/services/api', () => ({
  api: jest.fn(),
}));

const mockApi = api as jest.MockedFunction<typeof api>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('payRequest', () => {
  test('calls POST /api/payments/{uuid}/pay/', async () => {
    const mockResponse = { client_secret: 'pi_secret', amount_minor: 1299, currency: 'USD' };
    mockApi.mockResolvedValue(mockResponse);

    const result = await payRequest('test-uuid');

    expect(mockApi).toHaveBeenCalledWith('/api/payments/test-uuid/pay/', { method: 'POST' });
    expect(result).toEqual(mockResponse);
  });
});

describe('denyRequest', () => {
  test('calls POST /api/payments/{uuid}/deny/', async () => {
    mockApi.mockResolvedValue(undefined);

    await denyRequest('test-uuid');

    expect(mockApi).toHaveBeenCalledWith('/api/payments/test-uuid/deny/', { method: 'POST' });
  });
});

describe('getRequestStatus', () => {
  test('calls GET /api/payments/{uuid}/status/', async () => {
    const mockResponse = { id: 'test-uuid', status: 'PENDING', amount_minor: 1299, currency: 'USD', merchant_name: 'Store' };
    mockApi.mockResolvedValue(mockResponse);

    const result = await getRequestStatus('test-uuid');

    expect(mockApi).toHaveBeenCalledWith('/api/payments/test-uuid/status/');
    expect(result).toEqual(mockResponse);
  });
});

describe('pollForApproval', () => {
  test('returns status when no longer PENDING', async () => {
    mockApi
      .mockResolvedValueOnce({ status: 'PENDING' })
      .mockResolvedValueOnce({ status: 'APPROVED' });

    const result = await pollForApproval('test-uuid', { interval: 10, timeout: 5000 });

    expect(result).toBe('APPROVED');
    expect(mockApi).toHaveBeenCalledTimes(2);
  });

  test('throws on timeout', async () => {
    mockApi.mockResolvedValue({ status: 'PENDING' });

    await expect(
      pollForApproval('test-uuid', { interval: 10, timeout: 50 }),
    ).rejects.toThrow('Timed out');
  });
});
