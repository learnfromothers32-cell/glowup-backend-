import Paystack from 'paystack-sdk';
import {
  CardPaymentProvider,
  PaymentInitParams,
  PaymentInitResult,
  PaymentVerifyResult,
  PaymentChargeParams,
  PaymentChargeResult,
  WebhookResult,
} from '../../types';
import { validatePaystackSignature, parsePaystackEvent } from './webhook';

export class PaystackProvider implements CardPaymentProvider {
  readonly name = 'paystack';
  private paystack: Paystack;
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
    this.paystack = new Paystack(secretKey);
  }

  async initializePayment(params: PaymentInitParams): Promise<PaymentInitResult> {
    const result = await (this.paystack.transaction.initialize as any)({
      email: params.email,
      amount: String(params.amount * 100),
      currency: params.currency,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    });

    return {
      reference: result.data.reference,
      authorizationUrl: result.data.authorization_url ?? null,
      accessCode: result.data.access_code ?? null,
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    const result = await (this.paystack.transaction.verify as any)(reference);

    return {
      status:
        result.data.status === 'success'
          ? 'success'
          : result.data.status === 'pending'
            ? 'pending'
            : 'failed',
      reference: result.data.reference,
      amount: result.data.amount / 100,
      currency: result.data.currency || 'GHS',
    };
  }

  async chargeCard(params: PaymentChargeParams): Promise<PaymentChargeResult> {
    const result = await (this.paystack as any).transaction.charge({
      token: params.token,
      email: params.email,
      amount: String(params.amount * 100),
      currency: params.currency,
      metadata: params.metadata,
    });

    return {
      status: result.data.status === 'success' ? 'success' : 'failed',
      reference: result.data.reference,
      gatewayResponse: result.data.gateway_response,
    };
  }

  validateWebhookSignature(rawBody: Buffer, headers: Record<string, string>): boolean {
    return validatePaystackSignature(rawBody, headers, this.secretKey);
  }

  parseWebhookEvent(rawBody: Buffer): WebhookResult {
    return parsePaystackEvent(rawBody);
  }
}
