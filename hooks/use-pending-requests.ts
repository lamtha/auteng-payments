/**
 * Hook for fetching and managing pending payment requests.
 *
 * Fetches on mount and exposes a refresh() for pull-to-refresh.
 */
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/services/api';
import type { PaymentRequest } from '@/types/payment';

export interface PendingRequestsState {
  requests: PaymentRequest[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function usePendingRequests(): PendingRequestsState {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      setError(null);
      const data = await api<PaymentRequest[]>('/api/payments/pending/');
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchPending();
  }, [fetchPending]);

  return { requests, isLoading, error, refresh };
}
