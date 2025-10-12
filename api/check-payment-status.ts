import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const stripeSecret =
      process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_LIVE_SECRET_KEY ||
      process.env.STRIPE_SECRET ||
      process.env.STRIPE_API_KEY ||
      null;
    if (!stripeSecret) {
      console.error('Missing Stripe secret in runtime env for check-payment-status');
      return res.status(500).json({ error: 'Stripe key not configured' });
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

export const config = { runtime: 'nodejs' };
