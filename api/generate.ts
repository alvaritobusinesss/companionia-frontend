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
    const systemPrompt = buildSystemPrompt({
      modelName,
      mood: String(tone || 'natural'),
      style: String(style || 'natural'),
      topics: Array.isArray(topics) ? topics : [],
      emotion,
      memory,
      varietyTag,
    });

    // 4) Llamada a OpenAI (con opción de streaming)
    // Construcción de historial: usa el historial enviado por el cliente (últimos 16),
    // o cae en un mensaje con userMessage si no se envió historial.
    const recentMessages: Array<{ role: 'user'|'assistant'; content: string }> = Array.isArray(recentFromClient)
      ? recentFromClient.slice(-16).map((m: any) => ({ role: m.role, content: String(m.content || '') }))
      : (userMessage ? [{ role: 'user', content: String(userMessage) }] : []);

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
        stream: !!stream,
      }),
    });

    if (!oaRes.ok) {
      const txt = await oaRes.text();
      return res.status(500).json({ error: 'OpenAI error', details: txt });
    }

    // Si el cliente pidió streaming, reenviamos SSE tal cual
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      try {
        // Proxy de SSE: pasar chunks directamente
        // @ts-ignore - oaRes.body es un ReadableStream en Node en Vercel
        for await (const chunk of oaRes.body as any) {
          res.write(chunk);
        }
      } finally {
        res.end();
      }
      // Guardado de memoria de forma best-effort (no bloqueante)
      try {
        if (supabase) {
          const snippet = extractSnippet(userMessage || '');
          if (snippet) await upsertUserMemory(supabase, userId, snippet);
        }
      } catch {}
      return;
    }

    // Fallback: respuesta no streaming
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









