import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
    const PRICE_ID = process.env.STRIPE_PREMIUM_PRICE || '';
    if (!STRIPE_KEY || !PRICE_ID) {
      return res.status(500).json({ error: 'Stripe env missing (STRIPE_SECRET_KEY or STRIPE_PREMIUM_PRICE)' });
    }

    const stripe = new Stripe(STRIPE_KEY);

    // Base URL para redirecciones
    const headerProto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const headerHost = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string) || '';
    const derivedBase = headerHost ? `${headerProto}://${headerHost}` : '';
    const successBase =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VITE_APP_URL ||
      derivedBase ||
      'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ui_mode: 'hosted',
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${successBase}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successBase}/cancel`,
      payment_method_types: ['card'],
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (e: any) {
    console.error('create-checkout-session error:', e);
    return res.status(500).json({ error: e?.message || 'Stripe error' });
  }
}
