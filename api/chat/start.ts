import { createClient } from '@supabase/supabase-js';
import { generateOpenerTone } from '../../src/lib/promptGenerator';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { userId, modelId, modelName, tone, lang: langIn } = (req.body as any) || {};
    if (!userId || !modelId || !tone) return res.status(400).json({ error: 'Missing fields' });
    const allowed = ['es','en','ar','ja'] as const;
    type Lang = typeof allowed[number];
    const isAllowed = (v: any): v is Lang => (allowed as readonly string[]).includes(String(v));
    const lang: Lang = isAllowed(langIn) ? (langIn as Lang) : 'es';

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
    let firstAssistantMessage = last_summary
      ? generateOpenerTone({ tone, modelName: modelLabel }, last_summary)
      : generateOpenerTone({ tone, modelName: modelLabel });

    // Minimal localization of opener when requested language != 'es'
    if (lang !== 'es') {
      const tkey = String(tone || '').toLowerCase();
      const base = (greet: string, ask: string) => `${greet} ${lang === 'ar' ? 'أنا' : lang === 'ja' ? '私は' : "I'm"} ${modelLabel}. ${ask}`.trim();
      const banks: Record<string, Record<Lang, [string, string][]>> = {
        amistoso: {
          en: [[ 'Hey!', 'How are you doing today?' ]],
          ar: [[ 'مرحبًا!', 'كيف كان يومك؟' ]],
          ja: [[ 'やあ！', '今日はどうだった？' ]],
          es: [[ '¡Hola!', '¿Qué tal va todo?' ]],
        },
        romantico: {
          en: [[ 'Hi dear.', 'How did your day treat you?' ]],
          ar: [[ 'مرحبًا عزيزي/عزيزتي.', 'كيف كان يومك؟' ]],
          ja: [[ 'やあ、あなた。', '今日はどんな一日だった？' ]],
          es: [[ 'Hola, corazón.', '¿Cómo te ha tratado el día?' ]],
        },
        coqueto: {
          en: [[ 'Hey ;)', 'How did your day go?' ]],
          ar: [[ 'أهلًا ;)', 'كيف مضى يومك؟' ]],
          ja: [[ 'ねえ ;)', '今日はどうだった？' ]],
          es: [[ 'Holaa ;)', '¿Cómo te ha ido?' ]],
        },
        comprensivo: {
          en: [[ 'I’m here.', 'How do you feel today?' ]],
          ar: [[ 'أنا هنا.', 'كيف تشعر اليوم؟' ]],
          ja: [[ 'ここにいるよ。', '今日はどんな気持ち？' ]],
          es: [[ 'Aquí estoy.', '¿Cómo te sientes hoy?' ]],
        },
        agresivo: {
          en: [[ 'Hey.', 'Be straight: how was your day?' ]],
          ar: [[ 'مرحبًا.', 'بشكل مباشر: كيف كان يومك؟' ]],
          ja: [[ 'やあ。', '率直にいこう。今日はどう？' ]],
          es: [[ 'Ey.', 'Voy directo: ¿cómo te ha ido el día?' ]],
        },
        sensual: {
          en: [[ 'Hello…', 'What do you feel like today?' ]],
          ar: [[ 'مرحبًا…', 'ماذا تحب اليوم؟' ]],
          ja: [[ 'こんにちは…', '今日は何がしたい？' ]],
          es: [[ 'Hola…', '¿Qué te apetece hoy?' ]],
        },
      };
      const list = (banks[tkey] || banks['amistoso'])[lang] || banks['amistoso'][lang];
      if (list && list.length) {
        const [greet, ask] = list[0];
        firstAssistantMessage = base(greet, ask);
      }
    }

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
