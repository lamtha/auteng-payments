import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function AgentsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">No agents paired</ThemedText>
      <ThemedText style={styles.hint}>
        Pair an agent to allow it to request purchases on your behalf.
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
