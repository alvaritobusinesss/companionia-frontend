import Stripe from 'stripe';
import { handleStripeWebhook } from '../src/api/stripe-webhook';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sig = req.headers['stripe-signature'] as string;
    if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });
    // Read raw body from the request stream for signature verification
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const buf = Buffer.concat(chunks);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const stripeSecret = process.env.STRIPE_SECRET_KEY || null;
    if (!stripeSecret) {
      console.error('Missing Stripe secret in runtime env for webhook handler');
      return res.status(500).json({ error: 'Stripe key not configured' });
    }
    const stripe = new Stripe(stripeSecret);
    const event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);

    await handleStripeWebhook(event);
    return res.status(200).json({ received: true });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Webhook Error' });
  }
}
