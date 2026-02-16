/**
 * Sign-in screen — shown when unauthenticated.
 *
 * Displays AutEng branding and a native Apple Sign-In button.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuthContext } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SignInScreen() {
  const { signIn } = useAuthContext();
  const colorScheme = useColorScheme() ?? 'light';
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setIsSigningIn(true);
    try {
      await signIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.branding}>
        <ThemedText type="title" style={styles.title}>
          AutEng
        </ThemedText>
        <ThemedText style={styles.subtitle}>Agent Payments</ThemedText>
      </View>

      <View style={styles.actions}>
        {isSigningIn ? (
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme].tint}
            testID="loading-indicator"
          />
        ) : (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              colorScheme === 'dark'
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={8}
            style={styles.appleButton}
            onPress={handleSignIn}
          />
        )}

        {error ? (
          <ThemedText
            style={[styles.error, { color: Colors[colorScheme].danger }]}
            testID="error-message"
          >
            {error}
          </ThemedText>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 64,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  appleButton: {
    width: 280,
    height: 50,
  },
  error: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
  },
});
