/**
 * Device context — provides pairing state to the entire app.
 * Replaces auth-context.tsx (Apple Sign-In).
 */
import { createContext, useContext } from 'react';

import { useDevice, type DeviceState } from '@/hooks/use-device';

const DeviceContext = createContext<DeviceState | null>(null);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const device = useDevice();
  return <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>;
}

export function useDeviceContext(): DeviceState {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDeviceContext must be used within a DeviceProvider');
  }
  return context;
}
