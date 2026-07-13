export interface PaymentInitParams {
  amount: number;
  currency: string;
  email: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}

export interface PaymentInitResult {
  reference: string;
  authorizationUrl: string | null;
  accessCode: string | null;
}

export interface PaymentVerifyResult {
  status: 'success' | 'failed' | 'pending';
  reference: string;
  amount: number;
  currency: string;
}

export interface PaymentChargeParams {
  token: string;
  email: string;
  amount: number;
  currency: string;
  metadata: Record<string, unknown>;
}

export interface PaymentChargeResult {
  status: 'success' | 'failed';
  reference: string;
  gatewayResponse?: string;
}

export interface WebhookResult {
  event: 'success' | 'failed' | 'unknown';
  reference: string;
  providerMetadata?: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;

  initializePayment(params: PaymentInitParams): Promise<PaymentInitResult>;

  verifyPayment(reference: string): Promise<PaymentVerifyResult>;

  validateWebhookSignature(rawBody: Buffer, headers: Record<string, string>): boolean;

  parseWebhookEvent(rawBody: Buffer): WebhookResult;
}

export interface CardPaymentProvider extends PaymentProvider {
  chargeCard(params: PaymentChargeParams): Promise<PaymentChargeResult>;
}
