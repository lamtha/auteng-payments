import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { PaymentRequest } from '@/types/payment';

interface PaymentRequestCardProps {
  request: PaymentRequest;
}

function formatAmount(amountMinor: number, currency: string): string {
  const amount = amountMinor / 100;
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
}

function getTimeRemaining(expiresAt: string): { text: string; isUrgent: boolean } {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) {
    return { text: 'Expired', isUrgent: true };
  }
  const minutes = Math.ceil(diff / 60000);
  return {
    text: `${minutes}m left`,
    isUrgent: minutes < 5,
  };
}

export function PaymentRequestCard({ request }: PaymentRequestCardProps) {
  const borderColor = useThemeColor({}, 'border');
  const bgColor = useThemeColor({}, 'backgroundSecondary');
  const secondaryText = useThemeColor({}, 'textSecondary');
  const dangerColor = useThemeColor({}, 'danger');
  const tintColor = useThemeColor({}, 'tint');

  const [timeRemaining, setTimeRemaining] = useState(() =>
    getTimeRemaining(request.expires_at),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(request.expires_at));
    }, 30000);
    return () => clearInterval(interval);
  }, [request.expires_at]);

  return (
    <View style={[styles.card, { borderColor, backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={styles.amount}>
          {formatAmount(request.amount_minor, request.currency)}
        </ThemedText>
        <ThemedText
          style={[
            styles.timer,
            { color: timeRemaining.isUrgent ? dangerColor : secondaryText },
          ]}
        >
          {timeRemaining.text}
        </ThemedText>
      </View>

      <ThemedText type="defaultSemiBold">{request.merchant_name}</ThemedText>
      {request.merchant_domain ? (
        <ThemedText style={[styles.domain, { color: secondaryText }]}>
          {request.merchant_domain}
        </ThemedText>
      ) : null}

      <ThemedText style={styles.purpose}>{request.purpose}</ThemedText>

      <View style={[styles.agentBadge, { borderColor }]}>
        <ThemedText style={[styles.agentText, { color: tintColor }]}>
          {request.agent_name}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amount: {
    fontSize: 24,
  },
  timer: {
    fontSize: 14,
  },
  domain: {
    fontSize: 14,
  },
  purpose: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  agentBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  agentText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
