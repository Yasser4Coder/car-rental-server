import { env } from '../config/env.js';
import { getStripe } from '../config/stripe.js';
import { handleStripeWebhookEvent } from '../services/stripeWebhook.js';

/**
 * Stripe webhook — must receive raw body (mounted before express.json() in app.js).
 * @type {import('express').RequestHandler}
 */
export async function stripeWebhook(req, res, next) {
  if (!env.stripeWebhookSecret || !env.stripeSecretKey) {
    res.status(503).send('Stripe webhook not configured');
    return;
  }

  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    res.status(400).send('Missing stripe-signature');
    return;
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, env.stripeWebhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid signature';
    console.error('[stripe webhook] signature verification failed:', msg);
    res.status(400).send(`Webhook Error: ${msg}`);
    return;
  }

  console.log('[stripe webhook] received:', event.id, event.type);

  try {
    await handleStripeWebhookEvent(event);
  } catch (err) {
    next(err);
    return;
  }

  res.json({ received: true });
}
