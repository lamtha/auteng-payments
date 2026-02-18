import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';

import { PaymentRequestCard } from '@/components/payment-request-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePaymentAction } from '@/hooks/use-payment-action';
import { usePendingRequests } from '@/hooks/use-pending-requests';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { PaymentRequest } from '@/types/payment';

export default function PendingScreen() {
  const { requests, isLoading, error: fetchError, refresh } = usePendingRequests();
  const tintColor = useThemeColor({}, 'tint');
  const dangerColor = useThemeColor({}, 'danger');

  const onActionComplete = useCallback(() => {
    refresh();
  }, [refresh]);

  const { pay, deny, processingRequestId, error: actionError, clearError } = usePaymentAction(onActionComplete);

  const displayError = actionError ?? (fetchError ? 'Failed to load requests' : null);

  if (isLoading && requests.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (fetchError && requests.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={[styles.errorText, { color: dangerColor }]}>
          Failed to load requests
        </ThemedText>
        <Pressable onPress={refresh} style={[styles.retryButton, { borderColor: tintColor }]}>
          <ThemedText style={[styles.retryText, { color: tintColor }]}>Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {actionError ? (
        <Pressable
          style={[styles.errorBanner, { backgroundColor: dangerColor }]}
          onPress={clearError}
        >
          <ThemedText style={styles.errorBannerText}>{actionError}</ThemedText>
        </Pressable>
      ) : null}
      <FlatList<PaymentRequest>
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PaymentRequestCard
            request={item}
            onPay={pay}
            onDeny={deny}
            isProcessing={processingRequestId === item.id}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={tintColor} />
        }
        contentContainerStyle={requests.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <ThemedView style={styles.centered}>
            <ThemedText type="subtitle">No pending requests</ThemedText>
            <ThemedText style={styles.hint}>
              Payment requests from your agents will appear here.
            </ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  list: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  hint: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.6,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
