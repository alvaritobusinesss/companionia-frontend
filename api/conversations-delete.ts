import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { user_id, model_id } = req.body || {};
    if (!user_id || !model_id) return res.status(400).json({ error: 'missing ids' });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', String(user_id))
      .eq('model_id', String(model_id));

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'delete error' });
  }
}
