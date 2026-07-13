import { getProvider, isProviderConfigured } from './factory';
import { ApiError } from '../../utils/apiError';
import { isProduction } from '../../config/app';
import logger from '../../utils/logger';

export const verifyPaymentReference = async (
  paymentRef: string,
  expectedAmount: number,
  providerName: string = 'paystack',
): Promise<void> => {
  if (!isProviderConfigured(providerName) || !isProduction) return;

  try {
    const provider = getProvider(providerName);
    const verification = await provider.verifyPayment(paymentRef);
    if (verification.status !== 'success') {
      throw new ApiError(402, 'Payment not verified');
    }
    if (Math.abs(verification.amount - expectedAmount) > 0.01) {
      throw new ApiError(402, 'Payment amount does not match expected price');
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    logger.error(`${providerName} verification failed`, { error: (err as Error).message });
    throw new ApiError(502, 'Payment verification failed');
  }
};
