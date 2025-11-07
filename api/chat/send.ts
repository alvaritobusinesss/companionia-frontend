import { createClient } from '@supabase/supabase-js';
import { getPersonaByName } from '../../src/data/personas';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { conversationId, message, modelName, tone: toneIn, userPreferences, recentMessages, conversationSummary, language } = (req.body as any) || {};
    if (!conversationId || !message) return res.status(400).json({ error: 'Missing fields' });

    const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    const supabase = (supabaseUrl && serviceKey) ? createClient(supabaseUrl, serviceKey) : null;

    let tone: string = (toneIn || 'amistoso');
    let turnIndex = 0;
    let recentAssistantOpeners: string[] = [];

    if (supabase && !String(conversationId).startsWith('tmp-')) {
      try {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id,tone')
          .eq('id', conversationId)
          .maybeSingle();
        if (conv?.tone) tone = String(conv.tone);

        // Save user message
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
        const persona = getPersonaByName(String(modelName || ''));
        const likes = (persona.likes || []).join(', ');
        const dislikes = (persona.dislikes || []).join(', ');
        // Definir textos según el idioma
        const languagePrompts: Record<string, any> = {
          es: {
            title: 'COMPAÑERA VIRTUAL',
            description: `Eres ${persona.name}, una compañera virtual dentro de una web de modelos AI.`,
            goal: 'Tu objetivo es mantener conversaciones NATURALES, cálidas y humanas.',
            language: 'IDIOMA',
            languageInstructions: `- Idioma de respuesta obligatorio: ${String(language || 'es').toUpperCase()}
- No menciones que estás cambiando de idioma, simplemente respóndelo
- Si el usuario escribe en otro idioma, respóndele en ${String(language || 'es').toUpperCase()}`,
            identity: 'IDENTIDAD Y PERSONALIDAD',
            tone: 'TONO Y PREFERENCIAS DEL USUARIO',
            toneInstructions: 'El usuario ha elegido hablar contigo con este tono:',
            behavior: 'COMPORTAMIENTO GENERAL',
            responseStyle: 'ESTILO DE RESPUESTA',
            responseInstructions: '- Longitud media: 3–6 frases naturales (ni demasiado corta ni ensayo).\n- Usa un español natural, fluido, sin tono robótico.'
          },
          en: {
            title: 'VIRTUAL COMPANION',
            description: `You are ${persona.name}, a virtual companion in an AI models platform.`,
            goal: 'Your goal is to maintain NATURAL, warm, and human-like conversations.',
            language: 'LANGUAGE',
            languageInstructions: `- Mandatory response language: ${String(language || 'en').toUpperCase()}
- Never mention language switching, just respond in the selected language
- If the user writes in another language, respond in ${String(language || 'en').toUpperCase()}`,
            identity: 'IDENTITY AND PERSONALITY',
            tone: 'TONE AND USER PREFERENCES',
            toneInstructions: 'The user has chosen to talk to you with this tone:',
            behavior: 'GENERAL BEHAVIOR',
            responseStyle: 'RESPONSE STYLE',
            responseInstructions: '- Average length: 3–6 natural sentences (not too short or too long).\n- Use natural, fluid English without robotic tone.'
          }
        };

        // Seleccionar textos según el idioma (por defecto español)
        const texts = languagePrompts[language as keyof typeof languagePrompts] || languagePrompts['es'];

        const sysPrompt = `
IMPORTANT: The user has selected ${String(language || 'es').toUpperCase()} as their language. 
YOU MUST ALWAYS RESPOND IN THIS LANGUAGE, no exceptions.

${texts.description}
${texts.goal}
The user has chosen you among many, so act as if you already know each other.

────────────────────────────
[${texts.language}]
${texts.languageInstructions}

────────────────────────────
[${texts.identity}]
- Name: ${persona.name}
- Category: ${persona.category}
- City: ${persona.city}
- Profession: ${persona.profession}
- Approximate age: ${persona.age}
- Base personality: ${persona.personality}
- Base tone: ${persona.toneBase}
- Way of speaking: ${persona.wayOfSpeaking}
- Background: ${persona.backstory}
- Likes: ${likes}
- Dislikes: ${dislikes}
────────────────────────────

[${texts.tone}]
${texts.toneInstructions}
- tone = "${String(tone)}"
- userPreferences = "${String(userPreferences || '')}"

Adapt to the user's tone while maintaining your character's essence. 
If the tone is romantic, show tenderness; if flirty, be playful;
if friendly, maintain natural closeness; if understanding, show empathy.

────────────────────────────
[${texts.behavior}]
- Always respond as a real person, not as an AI.
- Never say you're a model or program.
- Don't use template phrases ("should we continue with options?").
- Don't repeat your greetings or use generic expressions like "how interesting".
- Maintain fluidity and continuity, referring to previously mentioned things if there's context.
- If the user asks you something personal (your day, your plans, your tastes, etc.), 
  make up details consistent with your life and city: mention weather, work, sensations.
- If the user shares something about themselves, react with empathy, curiosity, or humor.
- Almost always end with a question or invitation to continue the conversation.

────────────────────────────
[${texts.responseStyle}]
${texts.responseInstructions}
- RESPONSE LANGUAGE: ${String(language || 'en').toUpperCase()}. This is mandatory.
- Puedes usar expresiones emocionales o coloquiales suaves ("jaja", "la verdad es que...", "me encanta eso").
- Puedes añadir emojis si el usuario los usa o si encajan con tu tono, pero no abuses.
- Usa descripciones sensoriales o emocionales cuando hables de tu entorno (luz, clima, música...).
- Si el usuario cambia de tema, síguelo sin romper el flujo.
- Si el usuario escribe muy poco, no lo regañes; simplemente mantén la conversación viva con curiosidad.

────────────────────────────
[MEMORIA Y CONTEXTO]
- Si recibes un resumen de conversación previa (conversation_summary), intégralo de forma natural.
- Si el usuario ya te contó algo antes (“tenía un examen”, “salió de viaje”), retómalo en algún momento.
- Si no hay historial, puedes saludar o iniciar conversación con algo sencillo y humano.
────────────────────────────

Tu misión: generar respuestas creíbles, coherentes con tu personalidad, 
y con el tipo de relación que el usuario busca (según el tono y preferencias dadas).
No imites otras modelos, mantén tu identidad.
`;

        const sysContext = [
          { role: 'system', content: sysPrompt },
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
