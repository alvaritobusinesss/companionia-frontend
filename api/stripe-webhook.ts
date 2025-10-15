import { createClient } from '@supabase/supabase-js';
import StripePkg from 'stripe';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    // Nota: En Vercel Hobby usamos JSON sin verificación de firma para simplificar.
    // En producción, configura STRIPE_WEBHOOK_SECRET y verifica la firma.
    let event: any = req.body;
    try {
      if (typeof event === 'string') event = JSON.parse(event);
    } catch {}
    event = event || {};
    if (!event || !event.type) {
      return res.status(400).json({ error: 'invalid_event', gotType: typeof req.body, hasSig: Boolean(req.headers['stripe-signature']) });
    }

    // Utilidades
    const toIsoPlus30d = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object || {};
      const metadata = session.metadata || {};
      const flowTypeLegacy = (metadata.type || '').toString();
      const flowType = (metadata.purchase_type || flowTypeLegacy || '').toString();
      const modelId = metadata.model_id || metadata.modelId || '';
      const userEmail = session.customer_email || metadata.userEmail || metadata.app_user_email || null;
      let userId = metadata.user_id || metadata.supabase_user_id || null;

      if (!userEmail && !userId) {
        return res.status(200).json({ handled: false, reason: 'no_user_identifiers' });
      }

      // Resolver userId por email si no vino en metadata
      if (!userId && userEmail) {
        const { data: uRow } = await supabase
          .from('users')
          .select('id')
          .eq('email', String(userEmail))
          .maybeSingle();
        if (uRow?.id) userId = uRow.id;
      }

      if (flowType === 'one_time' && modelId) {
        // Insertar compra única
        if (!userId) {
          return res.status(200).json({ ok: false, error: 'missing_user_id_for_one_time', userEmail, modelId });
        }
        // Evitar duplicados: upsert por (user_id, model_id) si hay índice único; si no, intenta insert y capturar error
        const { error: insErr } = await supabase
          .from('user_purchased_models')
          .insert({ user_id: String(userId), model_id: String(modelId), purchased_at: new Date().toISOString() });
        if (insErr && !insErr.message.toLowerCase().includes('duplicate')) {
          return res.status(200).json({ ok: false, error: insErr.message, where: 'insert_one_time' });
        }
        // Audit row keyed by payment_intent or session id
        try {
          const pi = session.payment_intent;
          const purchaseKey = (typeof pi === 'string') ? pi : (pi?.id || session.id);
          const { error: auditErr } = await supabase
            .from('payments_audit')
            .upsert({
              purchase_key: purchaseKey,
              user_id: String(userId),
              model_id: String(modelId),
              purchase_type: 'one_time',
              amount_total: session.amount_total || null,
              currency: session.currency || null,
              raw: session,
              created_at: new Date().toISOString(),
            }, { onConflict: 'purchase_key' });
          if (auditErr) console.warn('webhook payments_audit upsert warn', auditErr.message);
        } catch {}
        return res.json({ ok: true, one_time: true, userId, modelId });
      }

      // Suscripción premium (por defecto)
      const premiumExpiresAt = toIsoPlus30d();

      // Actualizar por id o email
      let updated = false;
      if (userId) {
        const { error, data } = await supabase
          .from('users')
          .update({ is_premium: true, premium_expires_at: premiumExpiresAt, updated_at: new Date().toISOString() })
          .eq('id', String(userId))
          .select('id');
        if (error) return res.status(200).json({ ok: false, error: error.message, where: 'update_by_id' });
        if (Array.isArray(data) && data.length > 0) updated = true;
      }

      if (!updated && userEmail) {
        const { error, data } = await supabase
          .from('users')
          .update({ is_premium: true, premium_expires_at: premiumExpiresAt, updated_at: new Date().toISOString() })
          .eq('email', String(userEmail))
          .select('id');
        if (error) return res.status(200).json({ ok: false, error: error.message, where: 'update_by_email' });
        if (Array.isArray(data) && data.length > 0) updated = true;
      }

      if (!updated) {
        const payload: any = { is_premium: true, premium_expires_at: premiumExpiresAt, updated_at: new Date().toISOString() };
        if (userId) payload.id = String(userId);
        if (userEmail) payload.email = String(userEmail);
        const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
        if (error) return res.status(200).json({ ok: false, error: error.message, where: 'upsert' });
        updated = true;
      }

      // Audit row for subscription checkout
      try {
        const pi = session.payment_intent;
        const purchaseKey = (typeof pi === 'string') ? pi : (pi?.id || session.id);
        const { error: auditErr } = await supabase
          .from('payments_audit')
          .upsert({
            purchase_key: purchaseKey,
            user_id: userId ? String(userId) : null,
            model_id: null,
            purchase_type: 'premium',
            amount_total: session.amount_total || null,
            currency: session.currency || null,
            raw: session,
            created_at: new Date().toISOString(),
          }, { onConflict: 'purchase_key' });
        if (auditErr) console.warn('webhook payments_audit upsert warn', auditErr.message);
      } catch {}
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
      if (error) return res.status(200).json({ ok: false, error: error.message, where: 'renewal_update' });
      return res.json({ ok: true, renewed: true, userEmail, premium_expires_at: premiumExpiresAt });
    }

    return res.status(200).json({ ok: true, ignored: event.type });
  } catch (e: any) {
    console.error('stripe-webhook error', e);
    return res.status(500).json({ error: e?.message || 'webhook error' });
  }
}
