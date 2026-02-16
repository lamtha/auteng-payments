import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { DeviceProvider, useDeviceContext } from '@/contexts/device-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Inner layout that gates navigation based on device pairing state. */
function RootNavigator() {
  const { isPaired, isLoading } = useDeviceContext();
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const onPairScreen = segments[0] === 'pair-agent';

    if (!isPaired && !onPairScreen) {
      router.replace('/pair-agent');
    } else if (isPaired && onPairScreen) {
      router.replace('/');
    }
  }, [isPaired, isLoading, segments]);

  // Show loading screen while restoring device token from SecureStore
  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pair-agent" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <DeviceProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </DeviceProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
