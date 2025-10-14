// Import Stripe and relax typing to avoid TS issues on Vercel builders
import StripePkg from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  try {
    const sessionId = (req.query?.sessionId as string) || (req.body?.sessionId as string);
    const overrideEmail = (req.query?.email as string) || (req.body?.email as string) || undefined;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const STRIPE_KEY =
      process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_API_KEY ||
      process.env.STRIPE_SECRET ||
      '';
    if (!STRIPE_KEY) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }

    const Stripe: any = StripePkg as any;
    const stripe = new Stripe(STRIPE_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Solo marcar premium si el pago está realmente completo/paid
    const paid = session?.payment_status === 'paid' || session?.status === 'complete';
    const meta = (session?.metadata || {}) as Record<string, string>;
    const userId = meta?.supabase_user_id || undefined;
    const userEmail = overrideEmail || session?.customer_email || meta?.userEmail || meta?.app_user_email || null;

    if (!paid || !userEmail) {
      return res.status(200).json({ updated: false, reason: 'not_paid_or_no_email', status: session?.status, payment_status: session?.payment_status, customer_email: session?.customer_email, metadata: session?.metadata || {} });
    }

    // Establecer expiración por defecto a 30 días (suficiente para confirmar acceso inicial)
    const premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1) Intentar actualizar por id si lo tenemos
    let updated = false;
    if (userId) {
      const { error: errById, data: dataById } = await supabase
        .from('users')
        .update({ is_premium: true, premium_expires_at: premiumExpiresAt, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('id');
      if (errById) return res.status(500).json({ error: errById.message, where: 'update_by_id' });
      if (Array.isArray(dataById) && dataById.length > 0) updated = true;
    }

    // 2) Si no se pudo por id, intentar por email
    if (!updated && userEmail) {
      const { error: errByEmail, data: dataByEmail } = await supabase
        .from('users')
        .update({ is_premium: true, premium_expires_at: premiumExpiresAt, updated_at: new Date().toISOString() })
        .eq('email', userEmail)
        .select('id');
      if (errByEmail) return res.status(500).json({ error: errByEmail.message, where: 'update_by_email' });
      if (Array.isArray(dataByEmail) && dataByEmail.length > 0) updated = true;
    }

    // 3) Si ninguna actualización afectó filas, insertar (upsert mínimo) si tenemos id o email
    if (!updated) {
      const insertPayload: any = {
        is_premium: true,
        premium_expires_at: premiumExpiresAt,
        updated_at: new Date().toISOString(),
      };
      if (userId) insertPayload.id = String(userId);
      if (userEmail) insertPayload.email = String(userEmail);

      if (insertPayload.id || insertPayload.email) {
        const { error: insertErr } = await supabase
          .from('users')
          .upsert(insertPayload, { onConflict: 'id' });
        if (insertErr) return res.status(500).json({ error: insertErr.message, where: 'upsert' });
        updated = true;
      }
    }

    return res.json({ updated, userId, userEmail, premium_expires_at: premiumExpiresAt });
  } catch (e: any) {
    console.error('confirm-premium error', e);
    return res.status(500).json({ error: e?.message || 'confirm error' });
  }
}
