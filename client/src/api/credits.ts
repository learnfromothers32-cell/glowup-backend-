import api from './axios';

export interface CreditTransaction {
  type: 'purchase' | 'bonus' | 'usage' | 'refund';
  amount: number;
  description: string;
  createdAt: string;
}

export interface CreditsData {
  balance: number;
  lifetimeCredits: number;
  transactions: CreditTransaction[];
}

export interface CreditPackage {
  _id: string;
  name: string;
  credits: number;
  price: number;
  active: boolean;
}

export const getMyCredits = async () => {
  const { data } = await api.get('/credits');
  return data.data.credits as CreditsData;
};

export const getCreditPackages = async () => {
  const { data } = await api.get('/credits/packages');
  return data.data.packages as CreditPackage[];
};

export const purchaseCredits = async (packageId: string, paymentRef?: string) => {
  const { data } = await api.post('/credits/purchase', { packageId, paymentRef });
  return data.data.credits as { balance: number; lifetimeCredits: number };
};
