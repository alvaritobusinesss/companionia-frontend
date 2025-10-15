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

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }

    const stripe = new Stripe(STRIPE_KEY);
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Body y parámetros
    const body = typeof req.body === 'string' ? safeJsonParse(req.body) : (req.body || {});
    const type = String(body?.type || 'premium');
    const amount = Number.isFinite(body?.amount) ? Number(body.amount) : undefined; // en céntimos cuando aplique
    const currency = (body?.currency || 'EUR').toString().toLowerCase();
    const modelName = (body?.modelName || (type === 'donation' ? 'Donation' : 'Modelo')).toString();
    const modelId = body?.modelId ? String(body.modelId) : '';

    // Obtener usuario autenticado en servidor (token de Supabase en Authorization Bearer o cookie)
    const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
    const bearer = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;
    const cookie = (req.headers['cookie'] as string | undefined) || '';
    const cookieTokenMatch = cookie.match(/sb-access-token=([^;]+)/);
    const accessToken = bearer || (cookieTokenMatch ? decodeURIComponent(cookieTokenMatch[1]) : undefined);

    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized: no access token' });
    }

    const { data: userResp, error: userErr } = await supabase.auth.getUser(accessToken);
    if (userErr || !userResp?.user) {
      return res.status(401).json({ error: 'Unauthorized: user not found' });
    }
    const currentUser = userResp.user;

    // Email opcional, solo informativo
    const email = (currentUser.email || undefined) as string | undefined;

    // Base de redirección: priorizar el origin del cliente para mantener la MISMA sesión
    const preferReturnUrl = (typeof body?.returnUrl === 'string' && /^https?:\/\//i.test(body.returnUrl))
      ? body.returnUrl
      : undefined;
    const returnBase = preferReturnUrl || process.env.NEXT_PUBLIC_APP_URL || '';
    if (!returnBase) {
      return res.status(500).json({ error: 'Missing return base: provide body.returnUrl or set NEXT_PUBLIC_APP_URL' });
    }

    let session: Stripe.Checkout.Session;
    if (type === 'one_time' || type === 'donation') {
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
        cancel_url: `${returnBase}/`,
        payment_method_types: ['card'],
        client_reference_id: currentUser.id,
        metadata: {
          user_id: currentUser.id,
          model_id: modelId,
          purchase_type: type,
          amount: String(amount),
          currency,
          modelName,
          app: 'companionia',
        },
      });
    } else {
      if (!PRICE_ID) {
        const present = Object.keys(process.env).filter(k => k.toUpperCase().includes('STRIPE'));
        return res.status(500).json({ error: 'Missing STRIPE_PREMIUM_PRICE for premium subscriptions', present });
      }
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        ui_mode: 'hosted',
        line_items: [{ price: PRICE_ID, quantity: 1 }],
        success_url: `${returnBase}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnBase}/`,
        payment_method_types: ['card'],
        client_reference_id: currentUser.id,
        metadata: {
          user_id: currentUser.id,
          model_id: modelId,
          purchase_type: 'premium',
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
