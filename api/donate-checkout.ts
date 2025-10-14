import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const STRIPE_KEY =
      process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_API_KEY ||
      process.env.STRIPE_SECRET ||
      '';
    if (!STRIPE_KEY) {
      const present = Object.keys(process.env).filter(k => k.toUpperCase().includes('STRIPE'));
      return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY', present });
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

    const body = typeof req.body === 'string' ? safeJsonParse(req.body) : (req.body || {});
    const email = typeof body?.email === 'string' ? body.email : undefined;
    const userId = typeof body?.userId === 'string' ? body.userId : undefined;
    const currency = (body?.currency || 'EUR').toString().toLowerCase();
    const amount = Number.isFinite(body?.amount) ? Number(body.amount) : undefined; // céntimos
    const note = typeof body?.note === 'string' ? body.note.slice(0, 140) : undefined;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid donation amount (cents > 0)' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'hosted',
      line_items: [{
        price_data: {
          currency,
          unit_amount: Math.round(amount),
          product_data: { name: 'Donation' },
        },
        quantity: 1,
      }],
      success_url: `${successBase}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successBase}/cancel`,
      payment_method_types: ['card'],
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        type: 'donation',
        supabase_user_id: userId || '',
        userEmail: email || '',
        currency,
        amount: String(amount),
        note: note || '',
        app: 'companionia',
      },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (e: any) {
    console.error('donate-checkout error:', e);
    return res.status(500).json({ error: e?.message || 'Stripe error' });
  }
}

function safeJsonParse(text: string) {
  try { return JSON.parse(text || '{}'); } catch { return {}; }
}
