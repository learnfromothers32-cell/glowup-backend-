import { PaymentProvider } from './types';
import { PaystackProvider } from './providers/paystack';
import { appConfig } from '../../config/app';

const providers = new Map<string, PaymentProvider>();

const initProviders = (): void => {
  if (providers.size > 0) return;

  if (appConfig.paystackSecretKey) {
    providers.set('paystack', new PaystackProvider(appConfig.paystackSecretKey));
  }
};

export const getProvider = (name: string): PaymentProvider => {
  initProviders();
  const provider = providers.get(name);
  if (!provider) {
    throw new Error(`Payment provider "${name}" is not configured`);
  }
  return provider;
};

export const isProviderConfigured = (name: string): boolean => {
  initProviders();
  return providers.has(name);
};
