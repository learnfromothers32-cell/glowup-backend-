import crypto from 'crypto';
import { WebhookResult } from '../../types';

export const validatePaystackSignature = (
  rawBody: Buffer,
  headers: Record<string, string>,
  secretKey: string,
): boolean => {
  const signature = headers['x-paystack-signature'];
  if (!signature) return false;

  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'utf8');
  const hashBuf = Buffer.from(hash, 'utf8');

  if (sigBuf.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, hashBuf);
};

export const parsePaystackEvent = (rawBody: Buffer): WebhookResult => {
  let payload: any;
  if (Buffer.isBuffer(rawBody)) {
    payload = JSON.parse(rawBody.toString('utf8'));
  } else if (typeof rawBody === 'string') {
    payload = JSON.parse(rawBody);
  } else {
    payload = rawBody;
  }

  const eventType =
    payload.event === 'charge.success'
      ? 'success'
      : payload.event === 'charge.failed'
        ? 'failed'
        : 'unknown';

  return {
    event: eventType,
    reference: payload.data?.reference || '',
    amount: payload.data?.amount ? payload.data.amount / 100 : undefined,
    providerMetadata: payload.data
      ? {
          channel: payload.data.channel,
          gateway_response: payload.data.gateway_response,
          paid_at: payload.data.paid_at,
          created_at: payload.data.created_at,
        }
      : undefined,
  };
};
