import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const STRIPE_KEY =
      process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_API_KEY ||
      process.env.STRIPE_SECRET ||
      '';
    const PRICE_ID = process.env.STRIPE_PREMIUM_PRICE || '';
    if (!STRIPE_KEY || !PRICE_ID) {
      const present = Object.keys(process.env).filter(k => k.toUpperCase().includes('STRIPE'));
      return res.status(500).json({ error: 'Stripe env missing (STRIPE_SECRET_KEY or STRIPE_PREMIUM_PRICE)', present });
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

    // Datos del usuario autenticado (enviados desde el frontend)
    const body = typeof req.body === 'string' ? safeJsonParse(req.body) : (req.body || {});
    const email = typeof body?.email === 'string' ? body.email : undefined;
    const userId = typeof body?.userId === 'string' ? body.userId : undefined;
    const type = String(body?.type || 'premium');

    let session: Stripe.Checkout.Session;
    if (type === 'one_time') {
      // Pago único: usar price_data dinámico
      const amount = Number.isFinite(body?.amount) ? Number(body.amount) : undefined; // en céntimos
      const currency = (body?.currency || 'EUR').toString().toLowerCase();
      const modelName = (body?.modelName || 'Modelo').toString();
      const modelId = body?.modelId ? String(body.modelId) : '';
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount for one_time (must be cents integer > 0)' });
      }
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        ui_mode: 'hosted',
        line_items: [{
          price_data: {
            currency,
            unit_amount: Math.round(amount),
            product_data: { name: `${modelName} (unlock)` },
          },
          quantity: 1,
        }],
        success_url: `${successBase}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${successBase}/cancel`,
        payment_method_types: ['card'],
        customer_email: email,
        client_reference_id: userId,
        metadata: {
          supabase_user_id: userId || '',
          app_user_email: email || '',
          userEmail: email || '',
          type: 'one_time',
          modelId,
          amount: String(amount),
          currency,
          modelName,
          app: 'companionia',
        },
      });
    } else {
      // Suscripción premium
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        ui_mode: 'hosted',
        line_items: [{ price: PRICE_ID, quantity: 1 }],
        success_url: `${successBase}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${successBase}/cancel`,
        payment_method_types: ['card'],
        // Prefill del email para asociar el pago a la cuenta iniciada
        customer_email: email,
        client_reference_id: userId,
        metadata: {
          supabase_user_id: userId || '',
          app_user_email: email || '',
          userEmail: email || '',
          type: 'premium',
          modelId: body?.modelId ? String(body.modelId) : '',
          app: 'companionia',
        },
      });
    }

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (e: any) {
    console.error('create-checkout-session error:', e);
    return res.status(500).json({ error: e?.message || 'Stripe error' });
  }
}

function safeJsonParse(text: string) {
  try { return JSON.parse(text || '{}'); } catch { return {}; }
}
