import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    // Strict: use STRIPE_SECRET_KEY. Temporary fallback STRIPE_SK documented.
    let stripeSecret = process.env.STRIPE_SECRET_KEY || '';
    const stripeEnvKeys = Object.keys(process.env).filter(k => k.toUpperCase().includes('STRIPE'));
    if (!stripeSecret && process.env.STRIPE_SK) {
      console.warn('Using STRIPE_SK as temporary fallback in check-payment-status');
      stripeSecret = process.env.STRIPE_SK as string;
    }
    if (!stripeSecret) {
      console.error('STRIPE_SECRET_KEY missing (check-payment-status). Detected keys:', stripeEnvKeys);
      return res.status(500).json({ error: 'STRIPE_SECRET_KEY missing', detectedStripeEnvKeys: stripeEnvKeys });
    }
    if (!stripeSecret.startsWith('sk_')) {
      console.error('STRIPE_SECRET_KEY present but invalid format (check-payment-status)');
      return res.status(500).json({ error: 'STRIPE_SECRET_KEY has unexpected format' });
    }
    const stripe = new Stripe(stripeSecret);
    const { sessionId } = req.query;
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
      customerEmail: session.customer_email,
      metadata: session.metadata,
    });
  } catch (error: any) {
    console.error('Error checking payment status (serverless):', error);
    return res.status(500).json({ error: error?.message || 'Stripe status error' });
  }
}

export const config = { runtime: 'nodejs20.x' };
