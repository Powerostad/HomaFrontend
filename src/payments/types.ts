export type PaymentMarket = 'bazaar';

export type PaymentStartResult =
  | { status: 'redirected'; market: PaymentMarket; url: string }
  | { status: 'unavailable'; market: PaymentMarket; reason: string };

export interface PaymentRequest {
  sku: string;
  redirectUrl?: string;
}

export interface PaymentProvider {
  readonly market: PaymentMarket;
  startPayment(request: PaymentRequest): PaymentStartResult;
}
