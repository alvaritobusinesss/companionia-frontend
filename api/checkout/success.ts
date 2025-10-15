import StripePkg from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { session_id } = typeof req.body === 'string' ? safeJsonParse(req.body) : (req.body || {});
    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'session_id is required' });
    }

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

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent', 'line_items', 'customer'],
    });

    if (!session) return res.status(404).json({ error: 'session_not_found' });

    const paid = session.payment_status === 'paid' || session.status === 'complete';
    if (!paid) {
      return res.status(200).json({ ok: false, reason: 'not_paid', status: session?.status, payment_status: session?.payment_status });
    }

    const metadata = (session.metadata || {}) as Record<string, string>;
    const metaUserId = metadata.user_id || '';
    const metaModelId = metadata.model_id || '';
    const purchaseType = metadata.purchase_type || '';

    // Determine purchase key (idempotency)
    let purchaseKey: string | null = null;
    const pi = session.payment_intent as any;
    if (typeof pi === 'string') purchaseKey = pi;
    else if (pi && typeof pi.id === 'string') purchaseKey = pi.id;
    if (!purchaseKey) purchaseKey = session.id;

    // Minimal logging and user mismatch warning (no session changes)
    try {
      const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

      // Compare current authenticated user (if any) with metadata.user_id
      const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
      const bearer = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : undefined;
      const cookie = (req.headers['cookie'] as string | undefined) || '';
      const cookieTokenMatch = cookie.match(/sb-access-token=([^;]+)/);
      const accessToken = bearer || (cookieTokenMatch ? decodeURIComponent(cookieTokenMatch[1]) : undefined);

      if (accessToken) {
        const { data: u, error: gErr } = await supabase.auth.getUser(accessToken);
        if (!gErr && u?.user && metaUserId && u.user.id !== metaUserId) {
          console.warn('[checkout/success] Auth user mismatch with metadata.user_id', { currentUserId: u.user.id, metaUserId, purchaseKey });
        }
      }

      // For one-time purchases, upsert access row idempotently by (user_id, model_id)
      if (purchaseType === 'one_time' && metaUserId && metaModelId) {
        const purchasedAt = new Date().toISOString();
        // Prefer upsert to avoid duplicates; if unique not configured, fallback to insert with duplicate check
        const { error: upErr } = await supabase
          .from('user_purchased_models')
          .upsert(
            { user_id: String(metaUserId), model_id: String(metaModelId), purchased_at: purchasedAt },
            { onConflict: 'user_id,model_id' }
          );
        if (upErr) {
          // If upsert not supported with onConflict, try insert and ignore duplicates
          const { error: insErr } = await supabase
            .from('user_purchased_models')
            .insert({ user_id: String(metaUserId), model_id: String(metaModelId), purchased_at: purchasedAt });
          if (insErr && !String(insErr.message || '').toLowerCase().includes('duplicate')) {
            console.warn('[checkout/success] insert one_time failed', { err: insErr.message, metaUserId, metaModelId, purchaseKey });
          }
        }
      }

      // Optional audit row, idempotent by purchase_key
      try {
        const raw_session = session as any;
        const auditPayload: any = {
          purchase_key: purchaseKey,
          user_id: metaUserId || null,
          model_id: metaModelId || null,
          purchase_type: purchaseType || null,
          amount_total: session.amount_total || null,
          currency: session.currency || null,
          raw: raw_session || null,
          created_at: new Date().toISOString(),
        };
        // Try upsert on unique purchase_key
        const { error: auditErr } = await supabase
          .from('payments_audit')
          .upsert(auditPayload, { onConflict: 'purchase_key' });
        if (auditErr) {
          console.warn('[checkout/success] payments_audit upsert warning', auditErr.message);
        }
      } catch (auditEx) {
        console.warn('[checkout/success] payments_audit skipped', auditEx);
      }

      // We don't change any user session here.
    } catch (inner) {
      console.warn('[checkout/success] processing warning', inner);
    }

    return res.status(200).json({ ok: true, purchaseKey, amount_total: session.amount_total, currency: session.currency, session_id });
  } catch (e: any) {
    console.error('checkout/success error', e);
    return res.status(500).json({ error: e?.message || 'checkout success error' });
  }
}

function safeJsonParse(text: string) {
  try { return JSON.parse(text || '{}'); } catch { return {}; }
}
