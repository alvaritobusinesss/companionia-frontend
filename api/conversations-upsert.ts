import { createClient } from '@supabase/supabase-js';
import { summarizeRecentMessages } from '../src/lib/promptGenerator';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { user_id, model_id, model_name, messages, preferences } = req.body || {};
    if (!user_id || !model_id || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'missing fields' });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const last_summary = (() => {
      try {
        const simple = summarizeRecentMessages((messages || []).map((m: any) => ({ role: m.role, content: m.content })));
        return simple;
      } catch {
        return null;
      }
    })();
    const payload: any = {
      user_id: String(user_id),
      model_id: String(model_id),
      model_name: model_name || '',
      messages: messages.slice(-20),
      preferences: preferences || null,
      updated_at: new Date().toISOString(),
    };
    if (last_summary) payload.last_summary = last_summary;
    let upsertError = null as any;
    try {
      const { error } = await supabase
        .from('conversations')
        .upsert(payload, { onConflict: 'user_id,model_id' });
      if (error) upsertError = error;
    } catch (e: any) {
      upsertError = e;
    }
    if (upsertError) {
      // Retry without last_summary in case column doesn't exist
      try {
        const { error } = await supabase
          .from('conversations')
          .upsert({ ...payload, last_summary: undefined }, { onConflict: 'user_id,model_id' });
        if (error) return res.status(500).json({ error: error.message });
      } catch (e: any) {
        return res.status(500).json({ error: e?.message || 'upsert error' });
      }
    }
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'upsert error' });
  }
}
