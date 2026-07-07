// NOWPayments Integration - Crypto Payments Without Bank Account!
// Sign up at: https://nowpayments.io - No KYC required for basic usage

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';

// Price configuration (USD equivalent)
const NOWPAYMENTS_PRICES = {
  pro: { name: 'DocuMorph Pro', amount: 9, currency: 'usd' },
  enterprise: { name: 'DocuMorph Enterprise', amount: 29, currency: 'usd' }
};

/**
 * Create a NOWPayments invoice
 * @param {number} priceAmount - Amount in USD
 * @param {string} priceCurrency - Currency code (usd, eur, etc.)
 * @param {string} ipnCallbackUrl - Webhook URL for payment notifications
 * @param {string} orderId - Unique order identifier
 * @param {string} description - Payment description
 */
export async function createNowPaymentsInvoice(priceAmount, priceCurrency, ipnCallbackUrl, orderId, description) {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPayments not configured. Set NOWPAYMENTS_API_KEY environment variable.');
  }

  const response = await fetch(`${NOWPAYMENTS_BASE_URL}/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': NOWPAYMENTS_API_KEY
    },
    body: JSON.stringify({
      price_amount: priceAmount,
      price_currency: priceCurrency.toLowerCase(),
      pay_currency: 'usdt', // Default to USDT, user can change
      ipn_callback_url: ipnCallbackUrl,
      order_id: orderId,
      description,
      success_url: `${process.env.FRONTEND_URL || 'https://documorph-xi.vercel.app'}/success`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://documorph-xi.vercel.app'}/pricing`
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`NOWPayments API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get payment status
 */
export async function getNowPaymentsStatus(paymentId) {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPayments not configured');
  }

  const response = await fetch(`${NOWPAYMENTS_BASE_URL}/payment/${paymentId}`, {
    headers: { 'x-api-key': NOWPAYMENTS_API_KEY }
  });

  if (!response.ok) {
    throw new Error(`Failed to get status: ${response.status}`);
  }

  return response.json();
}

/**
 * Verify IPN callback from NOWPayments
 */
export function verifyNowPaymentsIPN(req) {
  if (!NOWPAYMENTS_IPN_SECRET) {
    console.warn('NOWPayments IPN secret not set - skipping signature verification');
    return req.body;
  }

  // TODO: Implement HMAC signature verification
  // For now, just return the parsed body
  return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
}

/**
 * Get supported currencies
 */
export async function getNowPaymentsCurrencies() {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPayments not configured');
  }

  const response = await fetch(`${NOWPAYMENTS_BASE_URL}/currencies`, {
    headers: { 'x-api-key': NOWPAYMENTS_API_KEY }
  });

  return response.json();
}

/**
 * Estimate payment amount (how much crypto for $X USD)
 */
export async function estimateNowPaymentsAmount(amount, fromCurrency = 'usd', toCurrency = 'usdt') {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('NOWPayments not configured');
  }

  const response = await fetch(
    `${NOWPAYMENTS_BASE_URL}/estimate?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`,
    { headers: { 'x-api-key': NOWPAYMENTS_API_KEY } }
  );

  return response.json();
}

export { NOWPAYMENTS_PRICES };