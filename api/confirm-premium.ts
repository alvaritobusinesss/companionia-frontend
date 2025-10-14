import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  try {
    const sessionId = (req.query?.sessionId as string) || (req.body?.sessionId as string);
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const STRIPE_KEY =
      process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_API_KEY ||
      process.env.STRIPE_SECRET ||
      '';
    if (!STRIPE_KEY) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });

    const stripe = new Stripe(STRIPE_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Solo marcar premium si el pago está realmente completo/paid
    const paid = session.payment_status === 'paid' || session.status === 'complete';
    const userEmail = session.customer_email || (session.metadata as any)?.userEmail || null;

    if (!paid || !userEmail) {
      return res.status(200).json({ updated: false, reason: 'not_paid_or_no_email', status: session.status, payment_status: session.payment_status });
    }

    // Calcular expiración a partir de la suscripción si existe; fallback 30 días
    let premiumExpiresAt: string | null = null;
    try {
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        if (sub?.current_period_end) {
          premiumExpiresAt = new Date(sub.current_period_end * 1000).toISOString();
        }
      }
    } catch {}
    if (!premiumExpiresAt) {
      premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error } = await supabase
      .from('users')
      .update({ is_premium: true, premium_expires_at: premiumExpiresAt, updated_at: new Date().toISOString() })
      .eq('email', userEmail);

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ updated: true, userEmail, premium_expires_at: premiumExpiresAt });
  } catch (e: any) {
    console.error('confirm-premium error', e);
    return res.status(500).json({ error: e?.message || 'confirm error' });
  }
}
