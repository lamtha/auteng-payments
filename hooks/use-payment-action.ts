import { useCallback, useState } from 'react';
import { confirmPlatformPayPayment, PlatformPay } from '@stripe/stripe-react-native';

import { payRequest, denyRequest, pollForApproval } from '@/services/payments';
import type { PaymentRequest } from '@/types/payment';

function formatCurrency(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}

export interface PaymentActionState {
  pay: (request: PaymentRequest) => Promise<void>;
  deny: (request: PaymentRequest) => Promise<void>;
  processingRequestId: string | null;
  error: string | null;
  clearError: () => void;
}

export function usePaymentAction(onComplete: () => void): PaymentActionState {
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const pay = useCallback(
    async (request: PaymentRequest) => {
      setError(null);
      setProcessingRequestId(request.id);

      try {
        // Step 1: Create PaymentIntent on backend
        const { client_secret } = await payRequest(request.id);

        // Step 2: Present Apple Pay sheet
        const { error: stripeError } = await confirmPlatformPayPayment(client_secret, {
          applePay: {
            cartItems: [
              {
                label: request.merchant_name,
                amount: formatCurrency(request.amount_minor),
                paymentType: PlatformPay.PaymentType.Immediate,
              },
              {
                label: 'AutEng Payments',
                amount: formatCurrency(request.amount_minor),
                paymentType: PlatformPay.PaymentType.Immediate,
              },
            ],
            merchantCountryCode: 'US',
            currencyCode: request.currency,
          },
        });

        if (stripeError) {
          // User cancelled or payment failed — request stays PENDING, can retry
          if (stripeError.code === 'Canceled') {
            setProcessingRequestId(null);
            return;
          }
          throw new Error(stripeError.message ?? 'Payment failed.');
        }

        // Step 3: Poll for webhook confirmation (APPROVED)
        await pollForApproval(request.id);

        onComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Payment failed.');
      } finally {
        setProcessingRequestId(null);
      }
    },
    [onComplete],
  );

  const deny = useCallback(
    async (request: PaymentRequest) => {
      setError(null);
      setProcessingRequestId(request.id);

      try {
        await denyRequest(request.id);
        onComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to deny request.');
      } finally {
        setProcessingRequestId(null);
      }
    },
    [onComplete],
  );

  return { pay, deny, processingRequestId, error, clearError };
}
