/**
 * Tests for hooks/use-payment-action.ts
 */
import { renderHook, act } from '@testing-library/react-native';
import { confirmPlatformPayPayment } from '@stripe/stripe-react-native';

import { usePaymentAction } from '@/hooks/use-payment-action';
import * as paymentsService from '@/services/payments';
import type { PaymentRequest } from '@/types/payment';

jest.mock('@/services/payments', () => ({
  payRequest: jest.fn(),
  denyRequest: jest.fn(),
  pollForApproval: jest.fn(),
}));

const mockPayRequest = paymentsService.payRequest as jest.MockedFunction<typeof paymentsService.payRequest>;
const mockDenyRequest = paymentsService.denyRequest as jest.MockedFunction<typeof paymentsService.denyRequest>;
const mockPollForApproval = paymentsService.pollForApproval as jest.MockedFunction<typeof paymentsService.pollForApproval>;
const mockConfirmPay = confirmPlatformPayPayment as jest.MockedFunction<typeof confirmPlatformPayPayment>;

function makeRequest(): PaymentRequest {
  return {
    id: 'req-uuid',
    agent_name: 'TestAgent',
    amount_minor: 1299,
    currency: 'USD',
    merchant_name: 'Example Store',
    merchant_domain: 'example.com',
    purpose: 'Buy stuff',
    line_items: [],
    status: 'PENDING',
    created_at: '2026-02-16T12:00:00Z',
    expires_at: new Date(Date.now() + 600000).toISOString(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usePaymentAction', () => {
  test('pay: full happy path', async () => {
    const onComplete = jest.fn();
    mockPayRequest.mockResolvedValue({ client_secret: 'pi_secret', amount_minor: 1299, currency: 'USD' });
    mockConfirmPay.mockResolvedValue({ error: undefined, paymentIntent: { id: 'pi_1' } } as any);
    mockPollForApproval.mockResolvedValue('APPROVED');

    const { result } = renderHook(() => usePaymentAction(onComplete));

    await act(async () => {
      await result.current.pay(makeRequest());
    });

    expect(mockPayRequest).toHaveBeenCalledWith('req-uuid');
    expect(mockConfirmPay).toHaveBeenCalled();
    expect(mockPollForApproval).toHaveBeenCalledWith('req-uuid');
    expect(onComplete).toHaveBeenCalled();
    expect(result.current.processingRequestId).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('pay: user cancels Apple Pay', async () => {
    const onComplete = jest.fn();
    mockPayRequest.mockResolvedValue({ client_secret: 'pi_secret', amount_minor: 1299, currency: 'USD' });
    mockConfirmPay.mockResolvedValue({ error: { code: 'Canceled', message: 'Canceled' } } as any);

    const { result } = renderHook(() => usePaymentAction(onComplete));

    await act(async () => {
      await result.current.pay(makeRequest());
    });

    // Should not call onComplete or poll — user simply cancelled
    expect(mockPollForApproval).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  test('deny: happy path', async () => {
    const onComplete = jest.fn();
    mockDenyRequest.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePaymentAction(onComplete));

    await act(async () => {
      await result.current.deny(makeRequest());
    });

    expect(mockDenyRequest).toHaveBeenCalledWith('req-uuid');
    expect(onComplete).toHaveBeenCalled();
    expect(result.current.processingRequestId).toBeNull();
  });

  test('pay: sets error on failure', async () => {
    const onComplete = jest.fn();
    mockPayRequest.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePaymentAction(onComplete));

    await act(async () => {
      await result.current.pay(makeRequest());
    });

    expect(result.current.error).toBe('Network error');
    expect(onComplete).not.toHaveBeenCalled();
  });
});
