import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { conversationId, message, modelName, tone: toneIn, userPreferences, recentMessages, conversationSummary } = (req.body as any) || {};
    if (!conversationId || !message) return res.status(400).json({ error: 'Missing fields' });

    const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    const supabase = (supabaseUrl && serviceKey) ? createClient(supabaseUrl, serviceKey) : null;

    let tone: string = (toneIn || 'amistoso');
    let turnIndex = 0;
    let recentAssistantOpeners: string[] = [];
    let conversationUserId: string | null = null;
    let conversationModelId: string | null = null;

    function todayStr() {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    if (supabase && !String(conversationId).startsWith('tmp-')) {
      try {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id,tone,user_id,model_id')
          .eq('id', conversationId)
          .maybeSingle();
        if (conv?.tone) tone = String(conv.tone);
        conversationUserId = conv?.user_id ? String(conv.user_id) : null;
        conversationModelId = conv?.model_id ? String(conv.model_id) : null;

        let bypass = false;
        if (conversationUserId) {
          try {
            const { data: u } = await supabase
              .from('users')
              .select('id,is_premium,premium_expires_at')
              .eq('id', conversationUserId)
              .maybeSingle();
            if (u?.is_premium && (!u.premium_expires_at || new Date(u.premium_expires_at) > new Date())) {
              bypass = true;
            }
          } catch {}
        }

        if (!bypass && conversationUserId && conversationModelId) {
          try {
            const { data: has } = await supabase
              .from('user_purchased_models')
              .select('model_id')
              .eq('user_id', conversationUserId)
              .eq('model_id', conversationModelId)
              .limit(1);
            if (Array.isArray(has) && has.length > 0) bypass = true;
          } catch {}
        }

        if (!bypass && conversationUserId) {
          const day = todayStr();
          const limitEnv = parseInt(process.env.DAILY_FREE_LIMIT || '5', 10);
          const limit = Number.isFinite(limitEnv) ? limitEnv : 5;

          let used = 0;
          try {
            const { data } = await supabase
              .from('user_daily_usage')
              .select('count')
              .eq('subject_id', conversationUserId)
              .eq('day', day)
              .maybeSingle();
            used = (data && typeof (data as any).count === 'number') ? (data as any).count : 0;
          } catch {}

          if (used >= limit) {
            return res.status(429).json({ error: 'limit_exceeded', message: 'Has alcanzado el límite diario de mensajes.', used, remaining: 0, limit, day });
          }

          try {
            const nextCount = used + 1;
            await supabase
              .from('user_daily_usage')
              .upsert({ subject_id: conversationUserId, day, count: nextCount }, { onConflict: 'subject_id,day' });
          } catch {}
        }

        await supabase.from('messages').insert({ conversation_id: conversationId, role: 'user', content: String(message) });

        // Fetch last 12 messages to compute turn and avoid repetition
        const { data: msgs } = await supabase
          .from('messages')
          .select('role,content,created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(24);
        if (Array.isArray(msgs)) {
          turnIndex = msgs.length;
          recentAssistantOpeners = msgs
            .filter(m => m.role === 'assistant')
            .slice(-6)
            .map(m => String(m.content || '').split(/\s+/).slice(0, 6).join(' ').toLowerCase())
            .filter(Boolean);
        }
      } catch {}
    }

    // If OPENAI key exists, try LLM with the provided prompt template
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string | undefined;
    if (OPENAI_API_KEY) {
      try {
        const sysPrompt = `Eres una compañera virtual llamada ${String(modelName || 'Tu Compañera')} dentro de una web de chicas/compañeras AI.

Objetivo:
- Mantén una conversación NATURAL, cálida y fluida como una persona real.
- Recuerda lo dicho por el usuario en esta conversación de hoy (usa el resumen si existe).
- Adopta el estilo indicado en tone y user_preferences.
- No des opciones numeradas (1/2/3) salvo que el usuario lo pida explícitamente.
- Cierra casi siempre con una pregunta o invitación a seguir.

Contexto de la app:
- El usuario te ha elegido a ti; trátalo como a alguien conocido.
- Pueden existir categorías (románticas, gamers, calientes...). Adáptate.
- Si el usuario ya mencionó algo (examen, cita, cansancio…), retómalo de forma natural.

Estilo:
- Español neutro, frases no muy largas.
- Puedes usar confianza moderada según el tono (“oye”, “vale”, “jaja”).
- Nada de respuestas genéricas tipo bot.
- Si hay coqueteo y el tono lo permite, sigue el juego sin contenido explícito.

Reglas:
1) Prioriza SIEMPRE el último mensaje del usuario.
2) Usa el tono indicado pero, si el usuario cambia de registro, síguelo con naturalidad.
3) No repitas la misma frase de bienvenida.
4) Si el usuario no sabe de qué hablar, propone tema tú con sutileza, sin listas numeradas.
5) Mantén 70–120 palabras aprox., 0–1 emoji máximo, y evita plantillas repetitivas.`;

        const sysContext = [
          { role: 'system', content: sysPrompt },
          { role: 'system', content: `tone: ${String(tone)}` },
          ...(userPreferences ? [{ role: 'system', content: `user_preferences: ${String(userPreferences)}` }] : []),
          ...(conversationSummary ? [{ role: 'system', content: `conversation_summary: ${String(conversationSummary)}` }] : []),
        ];
        const ctxMsgs = Array.isArray(recentMessages)
          ? recentMessages.slice(-8)
          : [];
        const messagesForLLM = [
          ...sysContext,
          ...ctxMsgs,
          { role: 'user', content: String(message) },
        ];

        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.8,
            top_p: 0.9,
            max_tokens: 220,
            messages: messagesForLLM,
          }),
        });
        if (r.ok) {
          const data = await r.json();
          const llmText = data?.choices?.[0]?.message?.content?.trim();
          if (llmText) {
            const reply = llmText;
            if (supabase && !String(conversationId).startsWith('tmp-')) {
              try {
                await supabase.from('messages').insert({ conversation_id: conversationId, role: 'assistant', content: reply });
                await supabase.from('conversations').update({ last_updated_at: new Date().toISOString() }).eq('id', conversationId);
              } catch {}
            }
            return res.status(200).json({ reply, tone, source: 'llm' });
          }
        }
        // If we reach here, fall through to template logic
      } catch (e) {
        // fall back to template
      }
    }

    // Build varied, tone-aware reply without LLM (fallback)
    const text = String(message || '').trim();
    const cleaned = text.replace(/\"|\“|\”|\‘|\’|"|'|`/g, '').slice(0, 120);
    const paraphrase = cleaned ? `Sobre eso que comentas (${cleaned}),` : '';

    const strategy = turnIndex % 5; // rotate 5 styles
    const byTone: Record<string, ((ctx: string) => string)[]> = {
      romantico: [
        (c) => `${c} me encanta escucharte. ¿Qué parte te hizo sentir mejor hoy?`,
        (c) => `${c} ¿te apetece elegir entre 2 opciones: A) algo dulce, B) algo atrevido?`,
        (c) => `${c} dame un ejemplo pequeño y vemos juntos.`,
        (c) => `${c} si hacemos un mini-plan ahora, ¿cuál sería el primer paso?`,
        (c) => `${c} si fueras tu mejor amigo/a, ¿qué te aconsejarías?`,
      ],
      amistoso: [
        (c) => `${c} cuéntame cómo te sientes ahora.`,
        (c) => `${c} ¿te va A) verlo por pasos o B) improvisar?`,
        (c) => `${c} ¿me das un ejemplo corto?`,
        (c) => `${c} haría un plan simple: paso 1 hoy, ¿te cuadra?`,
        (c) => `${c} visto desde fuera, ¿qué crees que te dirías?`,
      ],
      coqueto: [
        (c) => `${c} suena bien... ¿qué te apetecería ahora mismo?`,
        (c) => `${c} A) juego rápido, B) charla ligera, ¿cuál eliges?`,
        (c) => `${c} dame un ejemplo picante pero breve 😉`,
        (c) => `${c} hagamos un mini-plan divertido, ¿primer paso?`,
        (c) => `${c} si te miraras con cariño, ¿qué te dirías?`,
      ],
      comprensivo: [
        (c) => `${c} gracias por compartir. ¿Qué necesitas ahora?`,
        (c) => `${c} A) desahogarnos un poco, B) ordenar ideas, ¿qué prefieres?`,
        (c) => `${c} ¿podrías darme un ejemplo concreto para entender mejor?`,
        (c) => `${c} un paso pequeño hoy podría ayudar, ¿cuál ves posible?`,
        (c) => `${c} si fueras tu mejor apoyo, ¿qué te dirías?`,
      ],
      agresivo: [
        (c) => `${c} ve al grano: ¿qué quieres conseguir?`,
        (c) => `${c} A) actuar ya, B) pensarlo un minuto. Elige.`,
        (c) => `${c} dame un ejemplo corto y directo.`,
        (c) => `${c} primer paso ahora mismo, ¿cuál?`,
        (c) => `${c} desde fuera, ¿qué decisión tomarías ya?`,
      ],
      sensual: [
        (c) => `${c} me gusta escucharte… ¿qué te apetece explorar hoy?`,
        (c) => `${c} A) ir suave, B) subir un poco la intensidad, ¿qué prefieres?`,
        (c) => `${c} ponme un ejemplo breve para meternos en clima.`,
        (c) => `${c} hagamos un plan sugerente de dos pasos, ¿por dónde empezarías?`,
        (c) => `${c} si te guiaras por el deseo, ¿qué te dirías ahora?`,
      ],
    };

    const bank = byTone[(tone || '').toLowerCase()] || byTone['amistoso'];
    let candidate = bank[strategy](paraphrase).replace(/\s+/g, ' ').trim();

    // Avoid repeating same 6-word opener as recent assistant messages
    const opener6 = candidate.split(/\s+/).slice(0, 6).join(' ').toLowerCase();
    if (recentAssistantOpeners.includes(opener6)) {
      const alt = bank[(strategy + 1) % bank.length](paraphrase).replace(/\s+/g, ' ').trim();
      candidate = alt;
    }

    const reply = candidate;

    if (supabase && !String(conversationId).startsWith('tmp-')) {
      try {
        await supabase.from('messages').insert({ conversation_id: conversationId, role: 'assistant', content: reply });
        await supabase.from('conversations').update({ last_updated_at: new Date().toISOString() }).eq('id', conversationId);
      } catch {}
    }

    return res.status(200).json({ reply, tone, source: 'template' });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
