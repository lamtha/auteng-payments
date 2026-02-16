/**
 * Pair Agent screen — shown when no device token exists (first launch)
 * or navigated to from the Agents tab.
 *
 * The user enters a 6-digit pairing code provided by the agent.
 */
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
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
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isPairing, setIsPairing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  async function handleSubmit(code: string) {
    setError(null);
    setIsPairing(true);
    try {
      await pair(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pairing failed. Please try again.');
    } finally {
      setIsPairing(false);
    }
  }

  function handleDigitChange(index: number, value: string) {
    // Only accept single digits
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < CODE_LENGTH - 1) {
      // Move focus to next input
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (digit && index === CODE_LENGTH - 1) {
      const code = newDigits.join('');
      if (code.length === CODE_LENGTH) {
        Keyboard.dismiss();
        handleSubmit(code);
      }
    }
  }

  function handleKeyPress(index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      // Move focus to previous input on backspace when current is empty
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  }

  const colors = Colors[colorScheme];

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

        <View style={styles.codeRow} testID="code-input">
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.digitInput,
                {
                  color: colors.text,
                  borderColor: error ? colors.danger : colors.border,
                  backgroundColor: colors.backgroundSecondary,
                },
              ]}
              value={digit}
              onChangeText={(v) => handleDigitChange(index, v)}
              onKeyPress={(e) => handleKeyPress(index, e)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isPairing}
              testID={`digit-${index}`}
            />
          ))}
        </View>

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
                setDigits(Array(CODE_LENGTH).fill(''));
                inputRefs.current[0]?.focus();
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
  digitInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
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
