import { Platform } from 'react-native';

/**
 * AutEng Payments color tokens.
 * All color values in the app come from here — no hardcoded hex in components.
 */

const tintColorLight = '#0F62FE';
const tintColorDark = '#78A9FF';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#FFFFFF',
    backgroundSecondary: '#F4F4F5',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#E4E4E7',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#CA8A04',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#09090B',
    backgroundSecondary: '#18181B',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#27272A',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#EAB308',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});
