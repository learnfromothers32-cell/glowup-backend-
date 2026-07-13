export const PLATFORM_FEE_PERCENT = 0.13;

export const calculatePlatformFee = (amount: number): number =>
  Math.round(amount * PLATFORM_FEE_PERCENT);

export const calculateStylistPayout = (amount: number, platformFee: number): number =>
  amount - platformFee;

export const generateDevReference = (): string =>
  `DEV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
