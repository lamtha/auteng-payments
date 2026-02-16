/**
 * Hook for managing device pairing state.
 *
 * Restores device token from SecureStore on mount.
 * Provides pair/unpair actions for the UI.
 */
import { useCallback, useEffect, useState } from 'react';

import { setOnUnauthorized } from '@/services/api';
import {
  clearDeviceToken,
  pairAgent,
  restoreDeviceToken,
  type PairResponse,
} from '@/services/device';

export interface DeviceState {
  isPaired: boolean;
  isLoading: boolean;
  pair: (code: string) => Promise<PairResponse>;
  unpair: () => Promise<void>;
}

export function useDevice(): DeviceState {
  const [isPaired, setIsPaired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function restore() {
      try {
        const found = await restoreDeviceToken();
        if (mounted) setIsPaired(found);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    restore();

    // If the server rejects our stored token (401), clear it and go back to pairing
    setOnUnauthorized(() => {
      if (mounted) {
        clearDeviceToken();
        setIsPaired(false);
      }
    });

    return () => {
      mounted = false;
      setOnUnauthorized(null);
    };
  }, []);

  const pair = useCallback(async (code: string) => {
    const result = await pairAgent(code);
    setIsPaired(true);
    return result;
  }, []);

  const unpair = useCallback(async () => {
    await clearDeviceToken();
    setIsPaired(false);
  }, []);

  return { isPaired, isLoading, pair, unpair };
}
