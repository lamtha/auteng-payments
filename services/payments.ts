import { api } from '@/services/api';
import type { PayResponse, PaymentStatusResponse } from '@/types/payment';

/** Call POST /api/payments/{uuid}/pay/ to create a Stripe PaymentIntent. */
export async function payRequest(paymentUuid: string): Promise<PayResponse> {
  return api<PayResponse>(`/api/payments/${paymentUuid}/pay/`, {
    method: 'POST',
  });
}

/** Call POST /api/payments/{uuid}/deny/ to deny a payment request. */
export async function denyRequest(paymentUuid: string): Promise<void> {
  await api(`/api/payments/${paymentUuid}/deny/`, {
    method: 'POST',
  });
}

/** Call GET /api/payments/{uuid}/status/ to check current status. */
export async function getRequestStatus(paymentUuid: string): Promise<PaymentStatusResponse> {
  return api<PaymentStatusResponse>(`/api/payments/${paymentUuid}/status/`);
}

/**
 * Poll payment request status until it leaves PENDING state or timeout.
 * Returns the final status string.
 */
export async function pollForApproval(
  paymentUuid: string,
  opts?: { interval?: number; timeout?: number },
): Promise<string> {
  const interval = opts?.interval ?? 1500;
  const timeout = opts?.timeout ?? 30000;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const resp = await getRequestStatus(paymentUuid);
    if (resp.status !== 'PENDING') {
      return resp.status;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('Timed out waiting for payment confirmation.');
}
