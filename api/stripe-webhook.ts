import { createClient } from '@supabase/supabase-js';
import StripePkg from 'stripe';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  try {
    // Nota: En Vercel Hobby usamos JSON sin verificación de firma para simplificar.
    // En producción, configura STRIPE_WEBHOOK_SECRET y verifica la firma.
    const event = req.body || {};
    if (!event || !event.type) {
      return res.status(400).json({ error: 'invalid_event' });
    }

    // Utilidades
    const toIsoPlus30d = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object || {};
      const metadata = session.metadata || {};
      const userEmail = session.customer_email || metadata.userEmail || metadata.app_user_email || null;
      const userId = metadata.supabase_user_id || null;

      if (!userEmail && !userId) {
        return res.status(200).json({ handled: false, reason: 'no_user_identifiers' });
      }

      const premiumExpiresAt = toIsoPlus30d();

      // Actualizar por id o email
      let updated = false;
      if (userId) {
        const { error, data } = await supabase
          .from('users')
          .update({ is_premium: true, premium_expires_at: premiumExpiresAt, updated_at: new Date().toISOString() })
          .eq('id', String(userId))
          .select('id');
        if (error) return res.status(500).json({ error: error.message, where: 'update_by_id' });
        if (Array.isArray(data) && data.length > 0) updated = true;
      }

      if (!updated && userEmail) {
        const { error, data } = await supabase
          .from('users')
          .update({ is_premium: true, premium_expires_at: premiumExpiresAt, updated_at: new Date().toISOString() })
          .eq('email', String(userEmail))
          .select('id');
        if (error) return res.status(500).json({ error: error.message, where: 'update_by_email' });
        if (Array.isArray(data) && data.length > 0) updated = true;
      }

      if (!updated) {
        const payload: any = { is_premium: true, premium_expires_at: premiumExpiresAt, updated_at: new Date().toISOString() };
        if (userId) payload.id = String(userId);
        if (userEmail) payload.email = String(userEmail);
        const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
        if (error) return res.status(500).json({ error: error.message, where: 'upsert' });
        updated = true;
      }

      return res.json({ ok: true, updated, userId, userEmail, premium_expires_at: premiumExpiresAt });
    }

    if (event.type === 'invoice.payment_succeeded') {
      // Extender premium en renovaciones
      const invoice = event.data?.object || {};
      const userEmail = invoice.customer_email || null;
      if (!userEmail) return res.status(200).json({ handled: false, reason: 'no_email_on_invoice' });
      const premiumExpiresAt = toIsoPlus30d();
      const { error } = await supabase
        .from('users')
        .update({ is_premium: true, premium_expires_at: premiumExpiresAt, updated_at: new Date().toISOString() })
        .eq('email', String(userEmail));
      if (error) return res.status(500).json({ error: error.message, where: 'renewal_update' });
      return res.json({ ok: true, renewed: true, userEmail, premium_expires_at: premiumExpiresAt });
    }

    return res.status(200).json({ ok: true, ignored: event.type });
  } catch (e: any) {
    console.error('stripe-webhook error', e);
    return res.status(500).json({ error: e?.message || 'webhook error' });
  }
}
