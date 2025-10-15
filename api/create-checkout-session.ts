import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const STRIPE_KEY =
      process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_API_KEY ||
      process.env.STRIPE_SECRET ||
      '';
    const PRICE_ID = process.env.STRIPE_PREMIUM_PRICE || '';
    if (!STRIPE_KEY) {
      const present = Object.keys(process.env).filter(k => k.toUpperCase().includes('STRIPE'));
      return res.status(500).json({ error: 'Stripe env missing (STRIPE_SECRET_KEY)', present });
    }

    const stripe = new Stripe(STRIPE_KEY);

    // Base URL para redirecciones
    const headerProto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const headerHost = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string) || '';
    const derivedBase = headerHost ? `${headerProto}://${headerHost}` : '';

    // Datos del usuario autenticado (enviados desde el frontend)
    const body = typeof req.body === 'string' ? safeJsonParse(req.body) : (req.body || {});
    let email = typeof body?.email === 'string' ? body.email : (typeof body?.userEmail === 'string' ? body.userEmail : undefined);
    const userId = typeof body?.userId === 'string' ? body.userId : undefined;
    const type = String(body?.type || 'premium');

    // Fallback: si no nos pasan email pero tenemos userId, intentamos resolverlo desde Supabase
    if (!email && userId && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: uRow } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .maybeSingle();
        if (uRow?.email) email = String(uRow.email);
      } catch {}
    }

    // Permitir que el cliente fuerce el origin de retorno para mantener la misma sesión
    const preferReturnUrl = (typeof body?.returnUrl === 'string' && /^https?:\/\//i.test(body.returnUrl)) ? body.returnUrl : undefined;
    const returnBase = preferReturnUrl || derivedBase || process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || 'http://localhost:5173';

    let session: Stripe.Checkout.Session;
    if (type === 'one_time' || type === 'donation') {
      // Pago único: usar price_data dinámico
      const amount = Number.isFinite(body?.amount) ? Number(body.amount) : undefined; // en céntimos
      const currency = (body?.currency || 'EUR').toString().toLowerCase();
      const modelName = (body?.modelName || (type === 'donation' ? 'Donation' : 'Modelo')).toString();
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
        success_url: `${returnBase}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnBase}/cancel`,
        payment_method_types: ['card'],
        customer_email: email,
        customer_creation: 'always',
        client_reference_id: userId,
        metadata: {
          supabase_user_id: userId || '',
          app_user_email: email || '',
          userEmail: email || '',
          type: type,
          modelId,
          amount: String(amount),
          currency,
          modelName,
          app: 'companionia',
        },
      });
    } else {
      // Suscripción premium
      if (!PRICE_ID) {
        const present = Object.keys(process.env).filter(k => k.toUpperCase().includes('STRIPE'));
        return res.status(500).json({ error: 'Missing STRIPE_PREMIUM_PRICE for premium subscriptions', present });
      }
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        ui_mode: 'hosted',
        line_items: [{ price: PRICE_ID, quantity: 1 }],
        success_url: `${returnBase}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnBase}/cancel`,
        payment_method_types: ['card'],
        // Prefill del email para asociar el pago a la cuenta iniciada
        customer_email: email,
        customer_creation: 'always',
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
