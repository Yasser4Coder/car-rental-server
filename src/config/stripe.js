import Stripe from 'stripe';
import { env } from './env.js';
import { AppError } from '../utils/AppError.js';

/** @type {Stripe | null} */
let stripeClient = null;

function normalizedSecret() {
  return String(env.stripeSecretKey || '').trim();
}

/** True only when a real Stripe secret key (sk_…) is set — publishable pk_ keys are invalid here. */
export function isStripeConfigured() {
  const key = normalizedSecret();
  return key.startsWith('sk_test_') || key.startsWith('sk_live_');
}

export function getStripe() {
  const key = normalizedSecret();
  if (!key) {
    throw new AppError('Online payments are not configured.', 503);
  }
  if (key.startsWith('pk_')) {
    throw new AppError(
      'STRIPE_SECRET_KEY must be a secret key (sk_test_… or sk_live_…), not a publishable pk_ key.',
      503,
    );
  }
  if (!isStripeConfigured()) {
    throw new AppError(
      'STRIPE_SECRET_KEY looks invalid. Use sk_test_… (local) or sk_live_… (production) from Stripe Dashboard → Developers → API keys.',
      503,
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}
