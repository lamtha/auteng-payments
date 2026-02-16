/**
 * Tests for components/payment-request-card.tsx
 */
import { render, screen } from '@testing-library/react-native';

import { PaymentRequestCard } from '@/components/payment-request-card';
import type { PaymentRequest } from '@/types/payment';

// Mock useThemeColor to return predictable values
jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: (_props: Record<string, unknown>, colorName: string) => {
    const colors: Record<string, string> = {
      border: '#E4E4E7',
      backgroundSecondary: '#F4F4F5',
      textSecondary: '#687076',
      danger: '#DC2626',
      tint: '#0F62FE',
    };
    return colors[colorName] ?? '#000000';
  },
}));

function makeRequest(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
  return {
    id: 'test-uuid',
    agent_name: 'TestAgent',
    amount_minor: 1299,
    currency: 'USD',
    merchant_name: 'Example Store',
    merchant_domain: 'example.com',
    purpose: 'Buy replacement air filter',
    line_items: [{ name: 'Air filter', qty: 1, unit_price_minor: 1299 }],
    status: 'PENDING',
    created_at: '2026-02-15T12:00:00Z',
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min from now
    ...overrides,
  };
}

describe('PaymentRequestCard', () => {
  test('renders formatted amount', () => {
    render(<PaymentRequestCard request={makeRequest()} />);
    expect(screen.getByText('$12.99')).toBeTruthy();
  });

  test('renders merchant name', () => {
    render(<PaymentRequestCard request={makeRequest()} />);
    expect(screen.getByText('Example Store')).toBeTruthy();
  });

  test('renders merchant domain', () => {
    render(<PaymentRequestCard request={makeRequest()} />);
    expect(screen.getByText('example.com')).toBeTruthy();
  });

  test('renders purpose', () => {
    render(<PaymentRequestCard request={makeRequest()} />);
    expect(screen.getByText('Buy replacement air filter')).toBeTruthy();
  });

  test('renders agent name badge', () => {
    render(<PaymentRequestCard request={makeRequest()} />);
    expect(screen.getByText('TestAgent')).toBeTruthy();
  });

  test('renders time remaining', () => {
    render(<PaymentRequestCard request={makeRequest()} />);
    // Should show something like "10m left"
    expect(screen.getByText(/\d+m left/)).toBeTruthy();
  });

  test('hides domain when empty', () => {
    render(<PaymentRequestCard request={makeRequest({ merchant_domain: '' })} />);
    expect(screen.queryByText('example.com')).toBeNull();
  });

  test('shows Expired for past expiry', () => {
    const pastExpiry = new Date(Date.now() - 60000).toISOString();
    render(<PaymentRequestCard request={makeRequest({ expires_at: pastExpiry })} />);
    expect(screen.getByText('Expired')).toBeTruthy();
  });
});
