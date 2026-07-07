// Stripe Payments Integration
import Stripe from 'stripe';

// Initialize Stripe (will work once key is set)
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
} catch (e) {
  console.warn('Stripe not configured - payment features disabled');
}

// Product IDs (create these in Stripe dashboard)
const PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly'
};

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(priceId, successUrl, cancelUrl) {
  if (!stripe) {
    throw new Error('Payments not configured. Set STRIPE_SECRET_KEY.');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl || 'https://documorph.vercel.app/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: cancelUrl || 'https://documorph.vercel.app/pricing',
    metadata: {
      source: 'documorph'
    }
  });

  return session;
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(req) {
  if (!stripe) throw new Error('Payments not configured');

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      console.log('Payment successful:', event.data.object);
      break;
    case 'customer.subscription.updated':
      console.log('Subscription updated:', event.data.object);
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription cancelled:', event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return event;
}

export { PRICES };
