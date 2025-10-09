import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { userEmail, type, modelId } = req.body || {};
    if (!userEmail) return res.status(400).json({ error: 'userEmail is required' });

    if (type === 'premium') {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_premium: true,
          premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('email', userEmail);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, message: 'Usuario actualizado a premium' });
    }

    if (type === 'one_time' && modelId) {
      // Get user id by email
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();
      if (userErr || !userRow?.id) return res.status(404).json({ error: 'User not found' });

      const { error } = await supabase
        .from('user_purchased_models')
        .insert({ user_id: userRow.id, model_id: modelId, purchased_at: new Date().toISOString() });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, message: 'Modelo agregado a compras' });
    }

    return res.status(400).json({ error: 'Invalid type' });
  } catch (error: any) {
    console.error('simulate-payment error:', error);
    return res.status(500).json({ error: error?.message || 'simulate error' });
  }
}
