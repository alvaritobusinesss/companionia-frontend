import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const canUseServiceRole = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    const supabase = canUseServiceRole
      ? createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string)
      : null as any;

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

    let currentUser: any | null = null;
    if (accessToken && supabase) {
      const { data: userResp, error: userErr } = await supabase.auth.getUser(accessToken);
      if (!userErr && userResp?.user) {
        currentUser = userResp.user;
      }
    }
    // Fallback suave: confiar en body.userId si no pudimos obtener user por token.
    if (!currentUser) {
      const bodyUserId = body?.userId && typeof body.userId === 'string' ? body.userId : undefined;
      if (!bodyUserId) {
        return res.status(401).json({ error: 'Unauthorized: user not found (no token, no body.userId)' });
      }
      currentUser = { id: bodyUserId, email: body?.email || undefined };
    }

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
      // Intentar resolver un price_id de Stripe para el modelo
      const resolvedPriceId = resolveOneTimePriceId(modelId, modelName);
      const usingPriceId = Boolean(resolvedPriceId);

      if (!usingPriceId) {
        // Fallback: se requiere amount si no hay price_id
        if (!amount || amount <= 0) {
          return res.status(400).json({ error: 'Invalid amount for one_time (must be cents integer > 0) or configure ONE_TIME_PRICE_MAP/PRICE_ID_MODEL_<MODEL_ID>' });
        }
      }

      const lineItems = usingPriceId
        ? [{ price: resolvedPriceId as string, quantity: 1 }]
        : [{
            price_data: {
              currency,
              unit_amount: Math.round(amount as number),
              product_data: { name: `${modelName} (unlock)` },
            },
            quantity: 1,
          }];

      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        ui_mode: 'hosted',
        line_items: lineItems,
        success_url: `${returnBase}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnBase}/`,
        payment_method_types: ['card'],
        ...(email ? { customer_email: email } : {}),
        client_reference_id: currentUser.id,
        metadata: {
          user_id: currentUser.id,
          model_id: modelId,
          purchase_type: type,
          amount: usingPriceId ? 'price_id' : String(amount),
          currency,
          modelName,
          app: 'companionia',
          used_price_id: usingPriceId ? (resolvedPriceId as string) : '',
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
        ...(email ? { customer_email: email } : {}),
        client_reference_id: currentUser.id,
        metadata: {
          user_id: currentUser.id,
          model_id: modelId,
          purchase_type: 'premium',
          app: 'companionia',
        },
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (e: any) {
    console.error('create-checkout-session error:', e);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: e?.message || 'Stripe error' });
  }
}

function safeJsonParse(text: string) {
  try { return JSON.parse(text || '{}'); } catch { return {}; }
}

// Devuelve un price_id para compras one-time según variables de entorno de Vercel.
// Prioridades:
// 1) ONE_TIME_PRICE_MAP (JSON) por nombre o por id: {"Beauty":"price_xxx", "4":"price_yyy"}
// 2) PRICE_ID_MODEL_<NOMBRE_SANITIZADO>
// 3) PRICE_ID_MODEL_<ID_SANITIZADO>
// 4) undefined si no hay coincidencia
function resolveOneTimePriceId(modelId?: string, modelName?: string): string | undefined {
  const id = modelId || '';
  const name = modelName || '';

  // 1) JSON map
  const mapRaw = process.env.ONE_TIME_PRICE_MAP;
  if (mapRaw && typeof mapRaw === 'string') {
    try {
      const parsed = JSON.parse(mapRaw) as Record<string, string>;
      if (parsed && typeof parsed === 'object') {
        const byName = name ? parsed[name] : undefined;
        if (byName && typeof byName === 'string' && byName.startsWith('price_')) return byName;
        const byId = id ? parsed[id] : undefined;
        if (byId && typeof byId === 'string' && byId.startsWith('price_')) return byId;
      }
    } catch { /* ignore JSON errors */ }
  }

  // 2) Individual env var por NOMBRE
  if (name) {
    const keyByName = `PRICE_ID_MODEL_${sanitizeEnvKey(name)}`;
    const candidateByName = (process.env as any)[keyByName];
    if (candidateByName && typeof candidateByName === 'string' && candidateByName.startsWith('price_')) return candidateByName;
  }

  // 3) Individual env var por ID
  if (id) {
    const keyById = `PRICE_ID_MODEL_${sanitizeEnvKey(id)}`;
    const candidateById = (process.env as any)[keyById];
    if (candidateById && typeof candidateById === 'string' && candidateById.startsWith('price_')) return candidateById;
  }

  return undefined;
}

function sanitizeEnvKey(s: string) {
  // Reemplazar cualquier caracter no alfanumérico por '_', y mayúsculas
  return s.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
}
