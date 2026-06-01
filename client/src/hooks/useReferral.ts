import { useState } from 'react';

const STORAGE_REFERRAL_CODE = 'glowup_referral_code';
const STORAGE_REFERRER = 'glowup_referrer';
const STORAGE_REFERRAL_COUNT = 'glowup_referral_count';

// Generate a random code for the current user (if not exists)
export function getReferralCode(): string {
  let code = localStorage.getItem(STORAGE_REFERRAL_CODE);
  if (!code) {
    code = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem(STORAGE_REFERRAL_CODE, code);
  }
  return code;
}

// Get stored referrer code (from URL or localStorage)
export function getStoredReferrer(): string | null {
  // First check URL parameter
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    localStorage.setItem(STORAGE_REFERRER, ref);
    return ref;
  }
  return localStorage.getItem(STORAGE_REFERRER);
}

// Clear referrer after use (e.g., after first booking)
export function clearReferrer() {
  localStorage.removeItem(STORAGE_REFERRER);
}

// Record a successful referral (by referrer's code)
export function recordReferral(referrerCode: string) {
  const countMap = JSON.parse(localStorage.getItem(STORAGE_REFERRAL_COUNT) || '{}');
  countMap[referrerCode] = (countMap[referrerCode] || 0) + 1;
  localStorage.setItem(STORAGE_REFERRAL_COUNT, JSON.stringify(countMap));
}

// Get referral count for a given code
export function getReferralCount(code: string): number {
  const countMap = JSON.parse(localStorage.getItem(STORAGE_REFERRAL_COUNT) || '{}');
  return countMap[code] || 0;
}

// Get discount percentage based on number of referrals (tiered)
export function getReferralDiscount(referralCount: number): number {
  if (referralCount >= 5) return 100;
  if (referralCount >= 3) return 20;
  if (referralCount >= 1) return 10;
  return 0;
}

export function useReferral() {
  const [code] = useState<string>(() => getReferralCode());
  const [count] = useState<number>(() => getReferralCount(getReferralCode()));
  const [discount] = useState<number>(() => getReferralDiscount(getReferralCount(getReferralCode())));

  return { code, count, discount };
}