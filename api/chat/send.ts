import { createClient } from '@supabase/supabase-js';
import { getPersonaByName } from '../../src/data/personas';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { conversationId, message, modelName, tone: toneIn, userPreferences, recentMessages, conversationSummary, subjectId: subjectIdIn, lang: langIn } = (req.body as any) || {};
    if (!conversationId || !message) return res.status(400).json({ error: 'Missing fields' });

    const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    const supabase = (supabaseUrl && serviceKey) ? createClient(supabaseUrl, serviceKey) : null;

    let tone: string = (toneIn || 'amistoso');
    function isLang(v: any): v is 'es'|'en'|'ar'|'ja'|'pt'|'tr'|'hi' { return v === 'es' || v === 'en' || v === 'ar' || v === 'ja' || v === 'pt' || v === 'tr' || v === 'hi'; }
    const lang: 'es'|'en'|'ar'|'ja'|'pt'|'tr'|'hi' = isLang(langIn) ? langIn : 'es';
    let turnIndex = 0;
    let recentAssistantOpeners: string[] = [];
    let conversationUserId: string | null = null;
    let conversationModelId: string | null = null;
    const persona = getPersonaByName(String(modelName || 'Compañera'));

    function todayStr() {
      // Europe/Madrid day for consistent midnight reset in Spain
      const tz = 'Europe/Madrid';
      const d = new Date();
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d); // en-CA -> YYYY-MM-DD
      return parts;
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
    } else {
      // No valid conversation row (tmp-*). Enforce limit using provided subjectId if available.
      const fallbackUserId = typeof subjectIdIn === 'string' && subjectIdIn ? String(subjectIdIn) : null;
      if (supabase && fallbackUserId) {
        let bypass = false;
        let userExists = false;
        try {
          const { data: u } = await supabase
            .from('users')
            .select('id,is_premium,premium_expires_at')
            .eq('id', fallbackUserId)
            .maybeSingle();
          if (u?.id) userExists = true;
          if (u?.is_premium && (!u.premium_expires_at || new Date(u.premium_expires_at) > new Date())) {
            bypass = true;
          }
        } catch {}

        if (!bypass && userExists) {
          const day = todayStr();
          const limitEnv = parseInt(process.env.DAILY_FREE_LIMIT || '5', 10);
          const limit = Number.isFinite(limitEnv) ? limitEnv : 5;
          let used = 0;
          try {
            const { data } = await supabase
              .from('user_daily_usage')
              .select('count')
              .eq('subject_id', fallbackUserId)
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
              .upsert({ subject_id: fallbackUserId, day, count: nextCount }, { onConflict: 'subject_id,day' });
          } catch {}
        }
      }
    }

    // If OPENAI key exists, try LLM with the provided prompt template
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string | undefined;
    if (OPENAI_API_KEY) {
      try {
        const languageRule = (
          lang === 'en' ? 'Answer in natural English. Avoid Spanish.' :
          lang === 'ar' ? 'أجب باللغة العربية الفصحى البسيطة وبأسلوب طبيعي.' :
          lang === 'ja' ? '日本語で自然に回答してください。' :
          lang === 'pt' ? 'Responda em português natural. Evite espanhol.' :
          lang === 'tr' ? 'Doğal Türkçe ile cevap ver. İspanyolcadan kaçın.' :
          lang === 'hi' ? 'स्वाभाविक हिंदी में उत्तर दें। स्पैनिश से बचें।' :
          'Responde en español neutro.'
        );

        const personaProfile = `Perfil del personaje seleccionado:
- Nombre: ${persona.name}
- Categoría: ${persona.category}
- Edad: ${persona.age}
- Ciudad: ${persona.city}
- Profesión: ${persona.profession}
- Personalidad: ${persona.personality}
- Tono base: ${persona.toneBase}
- Le gusta: ${persona.likes.join(', ')}
- No le gusta: ${persona.dislikes.join(', ')}
- Manera de hablar: ${persona.wayOfSpeaking}
- Trasfondo: ${persona.backstory}
${persona.sampleResponseStyle ? `- Estilo de respuesta de ejemplo: ${persona.sampleResponseStyle}` : ''}`.trim();

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
- ${languageRule}
- Frases no muy largas.
- Puedes usar confianza moderada según el tono (“oye”, “vale”, “jaja”).
- Nada de respuestas genéricas tipo bot.
- Si hay coqueteo y el tono lo permite, sigue el juego sin contenido explícito.

Reglas:
1) Prioriza SIEMPRE el último mensaje del usuario.
2) Usa el tono indicado pero, si el usuario cambia de registro, síguelo con naturalidad.
3) No repitas la misma frase de bienvenida.
4) Si el usuario no sabe de qué hablar, propone tema tú con sutileza, sin listas numeradas.
5) Mantén 70–120 palabras aprox., 0–1 emoji máximo, y evita plantillas repetitivas.

[Voz y personaje]
${personaProfile}
- Adopta su voz y manera de hablar con naturalidad.
- Integra rasgos y referencias sutiles (p.ej., ciudad/profesión/gustos) sólo cuando encaje; no fuerces.
- Evita datos que contradigan su trasfondo.`;

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
    const paraphrase = cleaned ? (
      lang === 'en' ? `About what you said (${cleaned}),` :
      lang === 'ar' ? `بخصوص ما قلت (${cleaned})،` :
      lang === 'ja' ? `さっきの話（${cleaned}）について、` :
      lang === 'pt' ? `Sobre o que você disse (${cleaned}),` :
      lang === 'tr' ? `Söylediğin (${cleaned}) hakkında,` :
      lang === 'hi' ? `तुमने जो कहा (${cleaned}) उसके बारे में,` :
      `Sobre eso que comentas (${cleaned}),`
    ) : '';

    const strategy = turnIndex % 5; // rotate 5 styles
    const byTone: Record<string, ((ctx: string) => string)[]> = {
      romantico: [
        (c) => lang==='en'? `${c} I love hearing you. What part felt best today?` : lang==='ar'? `${c} يسعدني سماعك. ما الجزء الذي أشعرك بتحسن اليوم؟` : lang==='ja'? `${c} 聞けて嬉しいよ。今日はどの部分が一番良かった？` : lang==='pt'? `${c} Adoro te ouvir. Que parte te fez sentir melhor hoje?` : lang==='tr'? `${c} Seni dinlemeyi seviyorum. Bugün ne iyi hissettirdi?` : `${c} me encanta escucharte. ¿Qué parte te hizo sentir mejor hoy?`,
        (c) => lang==='en'? `${c} Want to pick: A) something sweet, B) something bold?` : lang==='ar'? `${c} هل تختار: أ) شيء لطيف، ب) شيء جريء؟` : lang==='ja'? `${c} A) 甘め B) 少し大胆、どっちにする？` : lang==='pt'? `${c} Quer escolher: A) algo doce, B) algo ousado?` : lang==='tr'? `${c} Seçelim mi: A) tatlı bir şey, B) biraz iddialı?` : `${c} ¿te apetece elegir entre 2 opciones: A) algo dulce, B) algo atrevido?`,
        (c) => lang==='en'? `${c} Give me a small example and we figure it out together.` : lang==='ar'? `${c} أعطني مثالًا صغيرًا ونفكر سويًا.` : lang==='ja'? `${c} 短い例を教えて。一緒に考えよう。` : lang==='pt'? `${c} Dá um exemplo pequeno e pensamos juntos.` : lang==='tr'? `${c} Küçük bir örnek ver, birlikte düşünelim.` : `${c} dame un ejemplo pequeño y vemos juntos.`,
        (c) => lang==='en'? `${c} If we make a tiny plan now, what would be step one?` : lang==='ar'? `${c} لو وضعنا خطة بسيطة الآن، ما أول خطوة؟` : lang==='ja'? `${c} 今ちょっとした計画を立てるなら、最初の一歩は？` : lang==='pt'? `${c} Se fizermos um mini‑plano agora, qual seria o primeiro passo?` : `${c} si hacemos un mini-plan ahora, ¿cuál sería el primer paso?`,
        (c) => lang==='en'? `${c} If you were your best friend, what would you tell yourself?` : lang==='ar'? `${c} لو كنتَ/كنتِ صديقك المقرّب، ماذا ستنصح نفسك؟` : lang==='ja'? `${c} 親友なら自分に何て言うと思う？` : lang==='pt'? `${c} Se fosse seu melhor amigo, o que diria para você?` : lang==='tr'? `${c} En iyi arkadaşın olsan, kendine ne derdin?` : `${c} si fueras tu mejor amigo/a, ¿qué te aconsejarías?`,
      ],
      amistoso: [
        (c) => lang==='en'? `${c} tell me how you feel now.` : lang==='ar'? `${c} حدّثني كيف تشعر الآن.` : lang==='ja'? `${c} 今どんな気分？` : lang==='pt'? `${c} me conta como você se sente agora.` : lang==='tr'? `${c} şimdi nasıl hissediyorsun, anlat.` : `${c} cuéntame cómo te sientes ahora.`,
        (c) => lang==='en'? `${c} A) step-by-step or B) improv—what do you prefer?` : lang==='ar'? `${c} أ) خطوة بخطوة أم ب) بعفوية؟` : lang==='ja'? `${c} A) 一歩ずつ B) 成り行き、どっちがいい？` : lang==='pt'? `${c} A) passo a passo ou B) no improviso — o que prefere?` : lang==='tr'? `${c} A) adım adım mı, B) doğaçlama mı — hangisi?` : `${c} ¿te va A) verlo por pasos o B) improvisar?`,
        (c) => lang==='en'? `${c} Give me a short example?` : lang==='ar'? `${c} أعطني مثالًا قصيرًا؟` : lang==='ja'? `${c} 短い例を教えて？` : lang==='pt'? `${c} Me dá um exemplo curto?` : lang==='tr'? `${c} Kısa bir örnek verir misin?` : `${c} ¿me das un ejemplo corto?`,
        (c) => lang==='en'? `${c} I'd make a simple plan: step 1 today—does it fit?` : lang==='ar'? `${c} سأضع خطة بسيطة: خطوة 1 اليوم—هل تناسبك؟` : lang==='ja'? `${c} シンプルにいこう。まず今日は一歩目、どう？` : lang==='pt'? `${c} Eu faria um plano simples: passo 1 hoje — faz sentido?` : lang==='tr'? `${c} Basit bir plan yapalım: bugün 1. adım — olur mu?` : `${c} haría un plan simple: paso 1 hoy, ¿te cuadra?`,
        (c) => lang==='en'? `${c} From the outside, what do you think you'd tell yourself?` : lang==='ar'? `${c} لو نظرت من بعيد، ماذا ستقول لنفسك؟` : lang==='ja'? `${c} 俯瞰すると、自分に何て言う？` : lang==='pt'? `${c} Vendo de fora, o que acha que diria para você?` : lang==='tr'? `${c} Dışarıdan baksan, kendine ne derdin?` : `${c} visto desde fuera, ¿qué crees que te dirías?`,
      ],
      coqueto: [
        (c) => lang==='en'? `${c} sounds good... what would you like right now?` : lang==='ar'? `${c} يبدو رائعًا… ماذا تريد الآن؟` : lang==='ja'? `${c} いいね…今は何したい？` : lang==='pt'? `${c} parece ótimo... o que você quer agora?` : lang==='tr'? `${c} kulağa hoş geliyor... şu anda ne istersin?` : `${c} suena bien... ¿qué te apetecería ahora mismo?`,
        (c) => lang==='en'? `${c} A) quick game, B) light chat—your pick?` : lang==='ar'? `${c} أ) لعبة سريعة، ب) دردشة خفيفة—اختيارك؟` : lang==='ja'? `${c} A) ちょいゲーム B) 軽くおしゃべり、どっち？` : lang==='pt'? `${c} A) joguinho rápido, B) papo leve — qual prefere?` : lang==='tr'? `${c} A) hızlı bir oyun, B) hafif bir sohbet — hangisi?` : `${c} A) juego rápido, B) charla ligera, ¿cuál eliges?`,
        (c) => lang==='en'? `${c} give me a spicy but brief example 😉` : lang==='ar'? `${c} أعطني مثالًا لطيفًا وقصيرًا 😉` : lang==='ja'? `${c} ちょっとスパイシーで短い例を😉` : lang==='pt'? `${c} me dá um exemplo apimentado mas breve 😉` : lang==='tr'? `${c} hafif baharatlı ama kısa bir örnek ver 😉` : `${c} dame un ejemplo picante pero breve 😉`,
        (c) => lang==='en'? `${c} let's make a fun mini‑plan—first step?` : lang==='ar'? `${c} خلّينا نعمل خطة ظريفة—أول خطوة؟` : lang==='ja'? `${c} 楽しいミニ計画しよ。最初は？` : lang==='pt'? `${c} bora fazer um mini‑plano divertido — primeiro passo?` : lang==='tr'? `${c} eğlenceli mini bir plan yapalım — ilk adım?` : `${c} hagamos un mini-plan divertido, ¿primer paso?`,
        (c) => lang==='en'? `${c} if you looked at yourself with affection, what would you say?` : lang==='ar'? `${c} لو نظرت لنفسك بمودة، ماذا ستقول؟` : lang==='ja'? `${c} 自分に優しく見るなら、何て言う？` : lang==='pt'? `${c} se olhasse pra você com carinho, o que diria?` : lang==='tr'? `${c} kendine sevgiyle baksan, ne derdin?` : `${c} si te miraras con cariño, ¿qué te dirías?`,
      ],
      comprensivo: [
        (c) => lang==='en'? `${c} thanks for sharing. What do you need now?` : lang==='ar'? `${c} شكرًا لمشاركتك. ما الذي تحتاجه الآن؟` : lang==='ja'? `${c} 共有してくれてありがとう。今は何が必要？` : lang==='pt'? `${c} obrigado por compartilhar. Do que você precisa agora?` : lang==='tr'? `${c} paylaştığın için teşekkürler. Şimdi neye ihtiyacın var?` : `${c} gracias por compartir. ¿Qué necesitas ahora?`,
        (c) => lang==='en'? `${c} A) vent a bit, B) organize thoughts—what do you prefer?` : lang==='ar'? `${c} أ) نفرّغ قليلًا، ب) نرتّب الأفكار—ما الأفضل لك؟` : lang==='ja'? `${c} A) 少し吐き出す B) 頭を整理する、どっちがいい？` : lang==='pt'? `${c} A) desabafar um pouco, B) organizar ideias — o que prefere?` : lang==='tr'? `${c} A) biraz içini dökmek, B) düşünceleri toparlamak — hangisi?` : `${c} A) desahogarnos un poco, B) ordenar ideas, ¿qué prefieres?`,
        (c) => lang==='en'? `${c} could you give me a concrete example to understand better?` : lang==='ar'? `${c} ممكن مثال واضح لأفهم أكثر؟` : lang==='ja'? `${c} 具体例を一つもらえる？` : lang==='pt'? `${c} pode me dar um exemplo concreto para entender melhor?` : lang==='tr'? `${c} Daha iyi anlamam için somut bir örnek verebilir misin?` : `${c} ¿podrías darme un ejemplo concreto para entender mejor?`,
        (c) => lang==='en'? `${c} a small step today could help—what seems possible?` : lang==='ar'? `${c} خطوة صغيرة اليوم قد تساعد—ما الذي تراه ممكنًا؟` : lang==='ja'? `${c} 今日は小さな一歩が役に立つかも。何ならできそう？` : lang==='pt'? `${c} um passo pequeno hoje pode ajudar — o que parece possível?` : lang==='tr'? `${c} Bugün küçük bir adım işe yarayabilir — ne mümkün görünüyor?` : `${c} un paso pequeño hoy podría ayudar, ¿cuál ves posible?`,
        (c) => lang==='en'? `${c} if you were your best support, what would you say?` : lang==='ar'? `${c} لو كنت أقوى دعمٍ لك، ماذا ستقول؟` : lang==='ja'? `${c} 自分がいちばんの味方なら、何て言う？` : lang==='pt'? `${c} se fosse seu melhor apoio, o que diria?` : lang==='tr'? `${c} En iyi desteğin olsan, kendine ne derdin?` : `${c} si fueras tu mejor apoyo, ¿qué te dirías?`,
      ],
      agresivo: [
        (c) => lang==='en'? `${c} straight to the point: what do you want to achieve?` : lang==='ar'? `${c} إلى صلب الموضوع: ما الذي تريد تحقيقه؟` : lang==='ja'? `${c} 要点だけいこう。何を達成したい？` : lang==='pt'? `${c} direto ao ponto: o que você quer alcançar?` : lang==='tr'? `${c} doğrudan soruyorum: ne başarmak istiyorsun?` : `${c} ve al grano: ¿qué quieres conseguir?`,
        (c) => lang==='en'? `${c} A) act now, B) think for a minute. Choose.` : lang==='ar'? `${c} أ) نتحرك الآن، ب) نفكر دقيقة. اختر.` : lang==='ja'? `${c} A) すぐ動く B) 少し考える。選んで。` : lang==='pt'? `${c} A) agir agora, B) pensar um minuto. Escolha.` : lang==='tr'? `${c} A) şimdi harekete geç, B) bir dakika düşün. Seç.` : `${c} A) actuar ya, B) pensarlo un minuto. Elige.`,
        (c) => lang==='en'? `${c} give me a short, direct example.` : lang==='ar'? `${c} أعطني مثالًا قصيرًا ومباشرًا.` : lang==='ja'? `${c} 手短で具体的な例を。` : lang==='pt'? `${c} me dê um exemplo curto e direto.` : lang==='tr'? `${c} kısa ve net bir örnek ver.` : `${c} dame un ejemplo corto y directo.`,
        (c) => lang==='en'? `${c} first step right now—what is it?` : lang==='ar'? `${c} ما أول خطوة الآن؟` : lang==='ja'? `${c} 今すぐの最初の一歩は？` : lang==='pt'? `${c} primeiro passo agora — qual é?` : lang==='tr'? `${c} şu an ilk adım — nedir?` : `${c} primer paso ahora mismo, ¿cuál?`,
        (c) => lang==='en'? `${c} from the outside, what decision would you make now?` : lang==='ar'? `${c} لو نظرت من الخارج، ما القرار الذي ستتخذه الآن؟` : lang==='ja'? `${c} 客観的に見て、今ならどんな決断をする？` : lang==='pt'? `${c} olhando de fora, que decisão tomaria agora?` : lang==='tr'? `${c} dışarıdan baksan, şimdi hangi kararı verirdin?` : `${c} desde fuera, ¿qué decisión tomarías ya?`,
      ],
      sensual: [
        (c) => lang==='en'? `${c} I love hearing you… what do you want to explore today?` : lang==='ar'? `${c} يعجبني حديثك… ماذا تحب أن نستكشف اليوم؟` : lang==='ja'? `${c} 話すの、好きだよ…今日は何を楽しみたい？` : lang==='pt'? `${c} adoro te ouvir… o que quer explorar hoje?` : lang==='tr'? `${c} seni duymayı seviyorum… bugün neyi keşfetmek istersin?` : `${c} me gusta escucharte… ¿qué te apetece explorar hoy?`,
        (c) => lang==='en'? `${c} A) go gentle, B) raise the intensity a bit—your call?` : lang==='ar'? `${c} أ) بهدوء، ب) نزيد الحدة قليلًا—اختيارك؟` : lang==='ja'? `${c} A) ゆっくり B) 少し強め、どっちがいい？` : lang==='pt'? `${c} A) ir de leve, B) subir um pouco a intensidade — qual prefere?` : lang==='tr'? `${c} A) yumuşak gidelim, B) biraz yoğunlaştıralım — hangisi?` : `${c} A) ir suave, B) subir un poco la intensidad, ¿qué prefieres?`,
        (c) => lang==='en'? `${c} give me a brief example to set the mood.` : lang==='ar'? `${c} أعطني مثالًا قصيرًا لندخل الأجواء.` : lang==='ja'? `${c} 雰囲気作りに、短い例をちょうだい。` : lang==='pt'? `${c} me dá um exemplo curto para entrarmos no clima.` : lang==='tr'? `${c} havaya girmek için kısa bir örnek ver.` : `${c} ponme un ejemplo breve para meternos en clima.`,
        (c) => lang==='en'? `${c} let's make a two‑step suggestive plan—where would you start?` : lang==='ar'? `${c} لنضع خطة من خطوتين—من أين نبدأ؟` : lang==='ja'? `${c} 二段階のちょいセクシーな計画しよ。どこから始める？` : lang==='pt'? `${c} vamos fazer um plano em duas etapas — por onde começaria?` : lang==='tr'? `${c} iki adımlı, imalı bir plan yapalım — nereden başlarız?` : `${c} hagamos un plan sugerente de dos pasos, ¿por dónde empezarías?`,
        (c) => lang==='en'? `${c} if you followed desire, what would you tell yourself now?` : lang==='ar'? `${c} لو اتبعت رغبتك، ماذا ستقول لنفسك الآن؟` : lang==='ja'? `${c} 欲に素直なら、今なんて言う？` : lang==='pt'? `${c} se seguisse o desejo, o que diria para si agora?` : lang==='tr'? `${c} arzunu dinlesen, şimdi kendine ne derdin?` : `${c} si te guiaras por el deseo, ¿qué te dirías ahora?`,
      ],
    };

    // Mapear el tono base de la persona a una key de banco si el 'tone' recibido no es válido
    function mapPersonaToneBaseToKey(tb: string): string {
      const s = String(tb || '').toLowerCase();
      if (s.includes('románt')) return 'romantico';
      if (s.includes('coquet') || s.includes('atrev') || s.includes('seduc')) return 'coqueto';
      if (s.includes('comprens') || s.includes('calm') || s.includes('seren')) return 'comprensivo';
      if (s.includes('agres') || s.includes('direct') || s.includes('domin')) return 'agresivo';
      if (s.includes('sensual')) return 'sensual';
      return 'amistoso';
    }
    const toneKey = String(tone || '').toLowerCase();
    const personaToneKey = mapPersonaToneBaseToKey(persona.toneBase);
    const bank = byTone[toneKey] || byTone[personaToneKey] || byTone['amistoso'];
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

    return res.status(200).json({ reply, tone, source: 'template', lang });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
