import { createClient } from '@supabase/supabase-js';
import { generateOpenerTone } from '../../src/lib/promptGenerator';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { userId, modelId, modelName, tone } = (req.body as any) || {};
    if (!userId || !modelId || !tone) return res.status(400).json({ error: 'Missing fields' });

    const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    const supabase = (supabaseUrl && serviceKey) ? createClient(supabaseUrl, serviceKey) : null;

    let conversationId: string | null = null;
    let last_summary: string | null = null;

    if (supabase) {
      try {
        // Find existing conversation with same tone
        const { data: existing, error: selErr } = await supabase
          .from('conversations')
          .select('id,last_summary,tone')
          .eq('user_id', userId)
          .eq('model_id', modelId)
          .eq('tone', tone)
          .order('last_updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (selErr) throw selErr;
        if (existing?.id) {
          conversationId = existing.id;
          last_summary = existing.last_summary ?? null;
        } else {
          const { data: inserted, error: insErr } = await supabase
            .from('conversations')
            .insert({ user_id: userId, model_id: modelId, tone, last_summary: null })
            .select('id')
            .single();
          if (insErr) throw insErr;
          conversationId = inserted.id;
        }
      } catch (e) {
        // If schema is missing, proceed without DB
        conversationId = conversationId || `tmp-${Date.now()}`;
      }
    } else {
      conversationId = `tmp-${Date.now()}`;
    }

    // Build a local opener (no LLM) with tone variety
    const modelLabel = String(modelName || modelId);
    const language = (req.body as any)?.language || 'es';
    const firstAssistantMessage = last_summary
      ? generateOpenerTone({ tone, modelName: modelLabel, language }, last_summary)
      : generateOpenerTone({ tone, modelName: modelLabel, language });

    // Try to persist first assistant message when creating a new conversation
    if (supabase && conversationId && !conversationId.startsWith('tmp-')) {
      try {
        await supabase.from('messages').insert({ conversation_id: conversationId, role: 'assistant', content: firstAssistantMessage });
        await supabase.from('conversations').update({ last_updated_at: new Date().toISOString() }).eq('id', conversationId);
      } catch {}
    }

    return res.status(200).json({ conversationId, firstAssistantMessage });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
