/**
 * Device identity service — stores and retrieves the device token.
 * Replaces auth.ts (Apple Sign-In + JWT refresh).
 *
 * The device token is a `dt_`-prefixed opaque string issued on first pairing.
 * It is stored in SecureStore and sent as a Bearer token on every API call.
 */
import * as SecureStore from 'expo-secure-store';

import { api, setAccessToken } from '@/services/api';

const DEVICE_TOKEN_KEY = 'device_token';

export interface PairResponse {
  device_token?: string;
  agent: {
    id: string;
    name: string;
  };
}

/** Get the stored device token (null if not yet paired). */
export async function getDeviceToken(): Promise<string | null> {
  return SecureStore.getItemAsync(DEVICE_TOKEN_KEY);
}

/** Store a device token in SecureStore and set it as the API auth token. */
export async function storeDeviceToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(DEVICE_TOKEN_KEY, token);
  setAccessToken(token);
}

/** Clear the device token (unpair all). */
export async function clearDeviceToken(): Promise<void> {
  await SecureStore.deleteItemAsync(DEVICE_TOKEN_KEY);
  setAccessToken(null);
}

/** Check if a device token is stored. */
export async function hasDeviceToken(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(DEVICE_TOKEN_KEY);
  return token !== null;
}

/**
 * Restore the device token on app launch.
 * Sets it as the API auth token if found.
 * Returns true if a token was found.
 */
export async function restoreDeviceToken(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(DEVICE_TOKEN_KEY);
  if (token) {
    setAccessToken(token);
    return true;
  }
  return false;
}

/**
 * Pair with an agent via pairing code.
 * On first pair (no existing device token), stores the returned device token.
 * Returns the agent info.
 */
export async function pairAgent(pairingCode: string): Promise<PairResponse> {
  const data = await api<PairResponse>('/api/payments/agents/pair/', {
    method: 'POST',
    body: JSON.stringify({ pairing_code: pairingCode }),
  });

  // First-time pairing: store the device token
  if (data.device_token) {
    await storeDeviceToken(data.device_token);
  }

  return data;
}
