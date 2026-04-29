import { supabase } from '@/lib/supabase';

export type CmiPaymentPayload = {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl?: string;
};

export type PaymentResult = {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
};

const CMI_MERCHANT_ID = process.env.EXPO_PUBLIC_CMI_MERCHANT_ID;
const CMI_STORE_KEY = process.env.EXPO_PUBLIC_CMI_STORE_KEY;
const CMI_API_URL =
  process.env.EXPO_PUBLIC_CMI_API_URL ?? 'https://payment.cmi.co.ma/fim/est3Dgate';

const isMockMode = !CMI_MERCHANT_ID || !CMI_STORE_KEY;

/**
 * Initiates a CMI payment.
 * - If credentials are missing: MOCK mode (simulated payment)
 * - If credentials are present: real CMI API call
 */
export async function initiateCmiPayment(payload: CmiPaymentPayload): Promise<{
  paymentUrl: string;
  isMock: boolean;
}> {
  if (isMockMode) {
    return mockInitiatePayment(payload);
  }
  return realInitiatePayment(payload);
}

// ==================================================================
// MOCK MODE (active by default)
// ==================================================================

async function mockInitiatePayment(payload: CmiPaymentPayload): Promise<{
  paymentUrl: string;
  isMock: boolean;
}> {
  return {
    paymentUrl: `mock://cmi/${payload.orderId}`,
    isMock: true,
  };
}

/**
 * Simulates a CMI payment outcome.
 * 90% success / 10% failure to exercise both flows.
 */
export function mockSimulatePaymentResult(): PaymentResult {
  const isSuccess = Math.random() > 0.1;

  if (isSuccess) {
    return {
      success: true,
      transactionId:
        'MOCK_' + Math.random().toString(36).substring(2, 15).toUpperCase(),
    };
  }

  return {
    success: false,
    errorMessage: 'Mock payment declined (test mode)',
  };
}

// ==================================================================
// REAL MODE (to be completed once CMI credentials are issued)
// ==================================================================

async function realInitiatePayment(_payload: CmiPaymentPayload): Promise<{
  paymentUrl: string;
  isMock: boolean;
}> {
  // TODO: implement once EXPO_PUBLIC_CMI_MERCHANT_ID and EXPO_PUBLIC_CMI_STORE_KEY are set.
  // See docs/CMI_INTEGRATION.md for the full integration steps.
  //
  // Outline:
  // 1. Compute SHA-512 signature (orderId + storeKey + amount + currency + ...)
  // 2. Build params: oid, amount, currency, okUrl, failUrl, lang, hash, etc.
  // 3. Build the redirect URL targeting CMI_API_URL with the params
  // 4. Return paymentUrl
  void CMI_API_URL;
  throw new Error(
    'Real CMI integration not yet implemented. See docs/CMI_INTEGRATION.md'
  );
}

// ==================================================================
// Order updates after payment
// ==================================================================

export async function markOrderAsPaid(
  orderId: string,
  transactionId: string
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_reference: transactionId,
      // paid_at is auto-set by trigger P9.2
    })
    .eq('id', orderId);

  if (error) {
    console.error('[paymentService] markOrderAsPaid error:', error);
    throw error;
  }
}

export async function markOrderAsFailed(
  orderId: string,
  errorReason: string
): Promise<void> {
  // We do NOT mark the order as 'cancelled' so the user can retry.
  console.warn(
    '[paymentService] Payment failed for order',
    orderId,
    ':',
    errorReason
  );
}

export { isMockMode };
