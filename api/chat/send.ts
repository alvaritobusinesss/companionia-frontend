import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { conversationId, message } = (req.body as any) || {};
    if (!conversationId || !message) return res.status(400).json({ error: 'Missing fields' });

    const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    const supabase = (supabaseUrl && serviceKey) ? createClient(supabaseUrl, serviceKey) : null;

    let tone: string = 'amistoso';
    if (supabase && !String(conversationId).startsWith('tmp-')) {
      try {
        const { data: conv } = await supabase.from('conversations').select('id,tone').eq('id', conversationId).maybeSingle();
        if (conv?.tone) tone = String(conv.tone);
        await supabase.from('messages').insert({ conversation_id: conversationId, role: 'user', content: String(message) });
      } catch {}
    }

    // Minimal non-stream reply (placeholder while wiring streaming)
    const lower = String(message || '').toLowerCase();
    let reply = '';
    if (lower.includes('examen')) reply = 'Quiero saber cómo ha ido ese examen. ¿Qué tal te sentiste al salir?';
    else if (lower.includes('trabajo')) reply = 'Suena intenso. ¿Qué parte del trabajo te pesa más ahora mismo?';
    else reply = 'Te leo. ¿Prefieres que lo veamos por pasos o te propongo 2 opciones y eliges?';

    if (supabase && !String(conversationId).startsWith('tmp-')) {
      try {
        await supabase.from('messages').insert({ conversation_id: conversationId, role: 'assistant', content: reply });
        await supabase.from('conversations').update({ last_updated_at: new Date().toISOString() }).eq('id', conversationId);
      } catch {}
    }

    return res.status(200).json({ reply, tone });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
