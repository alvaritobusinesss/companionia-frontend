// Using untyped req/res to avoid dependency on @vercel/node types in build
import { createClient } from '@supabase/supabase-js';

// Helpers locales
import { detectEmotion } from '../src/lib/detectEmotion';
import { getUserMemory, upsertUserMemory } from '../src/lib/memory';
import { buildSystemPrompt, generationConfig } from '../src/lib/promptGenerator';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

// Safe fallback generator (no OpenAI). Keeps conversation flowing if provider fails.
function buildSafeFallbackReply(opts: {
  modelName: string;
  mood: string;
  style: string;
  topics: string[];
  lastUser: string;
}): string {
  const { mood, style, topics } = opts;
  const t = (topics || []).filter(Boolean);
  const topic = t[0] || 'lo que te importa ahora';
  // Paraphrase user very briefly without quotes
  const cleaned = (opts.lastUser || '').replace(/"|\u201c|\u201d|\u201e|\u201f/g, '').trim();
  const short = cleaned.length > 80 ? cleaned.slice(0, 77) + '…' : cleaned;
  const paraphrase = short ? `Sobre eso que comentas (${short}),` : 'Vale,';
  const openers = [
    '¿Qué te gustaría conseguir con esto?',
    '¿Cómo te hace sentir ahora mismo?',
    `¿Prefieres que lo miremos por pasos o hablar de ${topic}?`,
    '¿Quieres que te proponga 2 opciones y eliges?',
  ];
  const q = openers[Math.floor(Math.random() * openers.length)];
  return `${paraphrase} te acompaño con un tono ${mood} y un estilo ${style}. ${q}`.trim();
}

  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }

    const { userId, userMessage, messages: recentFromClient, modelName, modelPersona, tone, topics, style, stream } = req.body || {};
    if (!userId || !modelName) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = (supabaseUrl && serviceKey)
      ? createClient(supabaseUrl, serviceKey)
      : null;

    // 1) Recuperar memoria
    const memory = supabase ? await getUserMemory(supabase, userId) : [];

    // 2) Emoción
    const emotion = await detectEmotion(userMessage);

    // 3) Construir mensajes con system prompt centralizado
    const varietyTag = `turn-${Date.now()}`;
    // Construcción de historial: usa el historial enviado por el cliente (últimos 16),
    // o cae en un mensaje con userMessage si no se envió historial.
    const recentMessages: Array<{ role: 'user'|'assistant'; content: string }> = Array.isArray(recentFromClient)
      ? recentFromClient.slice(-16).map((m: any) => ({ role: m.role, content: String(m.content || '') }))
      : (userMessage ? [{ role: 'user', content: String(userMessage) }] : []);
    const turnIndex = recentMessages.length;

    // Derivar frases a evitar de los últimos mensajes del asistente (primeras 6 palabras)
    const avoidPhrases = recentMessages
      .filter(m => m.role === 'assistant')
      .slice(-6)
      .map(m => (m.content || '').split(/\s+/).slice(0, 6).join(' ').toLowerCase())
      .filter(Boolean);

    const systemPrompt = buildSystemPrompt({
      modelName,
      mood: String(tone || 'natural'),
      style: String(style || 'natural'),
      topics: Array.isArray(topics) ? topics : [],
      emotion,
      memory,
      varietyTag,
      turnIndex,
      avoidPhrases,
    });

    // 4) Llamada a OpenAI (con opción de streaming)
    const oaRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: generationConfig.temperature,
        top_p: generationConfig.top_p,
        presence_penalty: generationConfig.presence_penalty,
        frequency_penalty: generationConfig.frequency_penalty,
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentMessages,
        ],
        // Streaming desactivado temporalmente para estabilidad
        stream: false,
      }),
    });

    if (!oaRes.ok) {
      const firstErrText = await oaRes.text();
      // Retry once without streaming if the first call failed
      try {
        const retryRes = await fetch(OPENAI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: generationConfig.temperature,
            top_p: generationConfig.top_p,
            presence_penalty: generationConfig.presence_penalty,
            frequency_penalty: generationConfig.frequency_penalty,
            messages: [
              { role: 'system', content: systemPrompt },
              ...recentMessages,
            ],
            stream: false,
          }),
        });
        if (retryRes.ok) {
          const data = await retryRes.json();
          const reply: string = data?.choices?.[0]?.message?.content?.trim() || '';
          return res.status(200).json({ reply, retried: true });
        }
        const retryText = await retryRes.text();
        // Safe fallback reply: keep conversation flowing without breaking UI
        const safeReply = buildSafeFallbackReply({
          modelName,
          mood: String(tone || 'natural'),
          style: String(style || 'natural'),
          topics: Array.isArray(topics) ? topics : [],
          lastUser: recentMessages.filter(m => m.role === 'user').slice(-1)[0]?.content || '',
        });
        return res.status(200).json({ reply: safeReply, fallback: true, error: 'OpenAI error', details: firstErrText, retryDetails: retryText });
      } catch (re) {
        const safeReply = buildSafeFallbackReply({
          modelName,
          mood: String(tone || 'natural'),
          style: String(style || 'natural'),
          topics: Array.isArray(topics) ? topics : [],
          lastUser: recentMessages.filter(m => m.role === 'user').slice(-1)[0]?.content || '',
        });
        return res.status(200).json({ reply: safeReply, fallback: true, error: 'OpenAI error', details: firstErrText, retryError: String(re) });
      }
    }

    // Respuesta no streaming
    const data = await oaRes.json();
    const reply: string = data?.choices?.[0]?.message?.content?.trim() || '';

    // 5) Guardar snippet simple (si aplica)
    const snippet = extractSnippet(userMessage);
    if (snippet && supabase) {
      await upsertUserMemory(supabase, userId, snippet);
    }

    return res.status(200).json({ reply });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error', code: e?.code || null });
  }
}

function extractSnippet(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes('me encanta')) return text;
  if (lower.includes('examen')) return text;
  if (lower.includes('trabajo')) return text;
  if (lower.includes('videojuego')) return text;
  if (lower.includes('me gusta')) return text;
  return null;
}









