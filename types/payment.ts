export interface LineItem {
  name: string;
  qty: number;
  unit_price_minor: number;
}

export interface PaymentRequest {
  id: string;
  agent_name: string;
  amount_minor: number;
  currency: string;
  merchant_name: string;
  merchant_domain: string;
  purpose: string;
  line_items: LineItem[];
  status: string;
  created_at: string;
  expires_at: string;
}
