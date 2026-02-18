/**
 * Tests for components/payment-request-card.tsx
 */
import { fireEvent, render, screen } from '@testing-library/react-native';

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

const mockOnPay = jest.fn();
const mockOnDeny = jest.fn();

function renderCard(overrides: Partial<PaymentRequest> = {}, isProcessing = false) {
  return render(
    <PaymentRequestCard
      request={makeRequest(overrides)}
      onPay={mockOnPay}
      onDeny={mockOnDeny}
      isProcessing={isProcessing}
    />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PaymentRequestCard', () => {
  test('renders formatted amount', () => {
    renderCard();
    expect(screen.getByText('$12.99')).toBeTruthy();
  });

  test('renders merchant name', () => {
    renderCard();
    expect(screen.getByText('Example Store')).toBeTruthy();
  });

  test('renders merchant domain', () => {
    renderCard();
    expect(screen.getByText('example.com')).toBeTruthy();
  });

  test('renders purpose', () => {
    renderCard();
    expect(screen.getByText('Buy replacement air filter')).toBeTruthy();
  });

  test('renders agent name badge', () => {
    renderCard();
    expect(screen.getByText('TestAgent')).toBeTruthy();
  });

  test('renders time remaining', () => {
    renderCard();
    expect(screen.getByText(/\d+m left/)).toBeTruthy();
  });

  test('hides domain when empty', () => {
    renderCard({ merchant_domain: '' });
    expect(screen.queryByText('example.com')).toBeNull();
  });

  test('shows Expired for past expiry', () => {
    const pastExpiry = new Date(Date.now() - 60000).toISOString();
    renderCard({ expires_at: pastExpiry });
    expect(screen.getByText('Expired')).toBeTruthy();
  });

  test('renders Pay button with amount', () => {
    renderCard();
    expect(screen.getByText('Pay $12.99')).toBeTruthy();
  });

  test('renders Deny button', () => {
    renderCard();
    expect(screen.getByText('Deny')).toBeTruthy();
  });

  test('calls onPay when Pay button pressed', () => {
    renderCard();
    fireEvent.press(screen.getByTestId('pay-button'));
    expect(mockOnPay).toHaveBeenCalledWith(expect.objectContaining({ id: 'test-uuid' }));
  });

  test('calls onDeny when Deny button pressed', () => {
    renderCard();
    fireEvent.press(screen.getByTestId('deny-button'));
    expect(mockOnDeny).toHaveBeenCalledWith(expect.objectContaining({ id: 'test-uuid' }));
  });

  test('shows spinner when processing', () => {
    renderCard({}, true);
    expect(screen.getByText('Processing...')).toBeTruthy();
    expect(screen.queryByText('Pay $12.99')).toBeNull();
    expect(screen.queryByText('Deny')).toBeNull();
  });
});
