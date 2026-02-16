/**
 * Pair Agent screen — shown when no device token exists (first launch).
 *
 * The user enters a 6-digit pairing code provided by the agent.
 * Supports typing digit-by-digit and pasting the full code.
 */
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useDeviceContext } from '@/contexts/device-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CODE_LENGTH = 6;

export default function PairAgentScreen() {
  const { pair } = useDeviceContext();
  const colorScheme = useColorScheme() ?? 'light';
  const [code, setCode] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  async function handleSubmit(value: string) {
    setError(null);
    setIsPairing(true);
    try {
      await pair(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pairing failed. Please try again.');
    } finally {
      setIsPairing(false);
    }
  }

  function handleChangeText(value: string) {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    setCode(cleaned);

    if (cleaned.length === CODE_LENGTH) {
      Keyboard.dismiss();
      handleSubmit(cleaned);
    }
  }

  const colors = Colors[colorScheme];
  const digits = code.split('');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.branding}>
        <ThemedText type="title" style={styles.title}>
          AutEng
        </ThemedText>
        <ThemedText style={styles.subtitle}>Agent Payments</ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.instructions}>
          Enter the 6-digit pairing code from your agent
        </ThemedText>

        <Pressable
          style={styles.codeRow}
          testID="code-input"
          onPress={() => inputRef.current?.focus()}
        >
          {Array.from({ length: CODE_LENGTH }, (_, index) => (
            <View
              key={index}
              style={[
                styles.digitBox,
                {
                  borderColor:
                    error
                      ? colors.danger
                      : index === digits.length
                        ? colors.tint
                        : colors.border,
                  backgroundColor: colors.backgroundSecondary,
                },
              ]}
              testID={`digit-${index}`}
            >
              <ThemedText style={styles.digitText}>
                {digits[index] ?? ''}
              </ThemedText>
            </View>
          ))}

          {/* Hidden input captures keyboard + paste */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={handleChangeText}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoFocus
            editable={!isPairing}
            testID="hidden-input"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
          />
        </Pressable>

        {isPairing ? (
          <ActivityIndicator
            size="large"
            color={colors.tint}
            style={styles.spinner}
            testID="loading-indicator"
          />
        ) : null}

        {error ? (
          <View style={styles.errorContainer}>
            <ThemedText
              style={[styles.error, { color: colors.danger }]}
              testID="error-message"
            >
              {error}
            </ThemedText>
            <Pressable
              onPress={() => {
                setError(null);
                setCode('');
                inputRef.current?.focus();
              }}
              testID="retry-button"
            >
              <ThemedText style={[styles.retryText, { color: colors.tint }]}>
                Try again
              </ThemedText>
            </Pressable>
          </View>
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
  content: {
    width: '100%',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  digitBox: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    fontSize: 24,
    fontWeight: '600',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  spinner: {
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
  },
  retryText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});
