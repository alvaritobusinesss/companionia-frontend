import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  try {
    const { sessionId } = req.query || {};
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const STRIPE_KEY =
      process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_API_KEY ||
      process.env.STRIPE_SECRET ||
      '';
    if (!STRIPE_KEY) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });

    const stripe = new Stripe(STRIPE_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
      customerEmail: session.customer_email,
      metadata: session.metadata || {},
    });
  } catch (error: any) {
    console.error('check-payment-status error:', error);
    return res.status(500).json({ error: error?.message || 'Stripe session error' });
  }
}
