import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuthContext } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Inner layout that gates navigation based on auth state. */
function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const onSignInScreen = segments[0] === 'sign-in';

    if (!isAuthenticated && !onSignInScreen) {
      router.replace('/sign-in');
    } else if (isAuthenticated && onSignInScreen) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Show loading screen while restoring session from SecureStore
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
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
