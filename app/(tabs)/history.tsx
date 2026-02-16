import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HistoryScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">No history yet</ThemedText>
      <ThemedText style={styles.hint}>
        Past payment requests and their outcomes will appear here.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hint: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.6,
  },
});
