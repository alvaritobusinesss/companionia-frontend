import Stripe from 'stripe';
import { handleStripeWebhook } from '../src/api/stripe-webhook';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sig = req.headers['stripe-signature'] as string;
    if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });

    // req.body is a Buffer thanks to vercel.json encoding raw
    const buf = (req as any).body as Buffer;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);

    await handleStripeWebhook(event);
    return res.status(200).json({ received: true });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Webhook Error' });
  }
}
