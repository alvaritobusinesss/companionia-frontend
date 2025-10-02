// Using untyped req/res to avoid dependency on @vercel/node types in build
import { createClient } from '@supabase/supabase-js';

// Helpers locales
import { detectEmotion } from '../src/lib/detectEmotion';
import { buildPrompt } from '../src/lib/promptBuilder';
import { getUserMemory, upsertUserMemory } from '../src/lib/memory';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }

    const { userId, userMessage, modelName, modelPersona, tone, topics, stream } = req.body || {};
    if (!userId || !userMessage || !modelName) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1) Recuperar memoria
    const memory = await getUserMemory(supabase, userId);

    // 2) Emoción
    const emotion = await detectEmotion(userMessage);

    // 3) Prompt
    const prompt = buildPrompt({
      userMessage,
      modelName,
      modelPersona,
      tone,
      topics: Array.isArray(topics) ? topics : [],
      emotion,
      memory,
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
        temperature: 0.8,
        top_p: 0.9,
        presence_penalty: 0.3,
        messages: [{ role: 'user', content: prompt }],
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
        const snippet = extractSnippet(userMessage);
        if (snippet) await upsertUserMemory(supabase, userId, snippet);
      } catch {}
      return;
    }

    // Fallback: respuesta no streaming
    const data = await oaRes.json();
    const reply: string = data?.choices?.[0]?.message?.content?.trim() || '';

    // 5) Guardar snippet simple (si aplica)
    const snippet = extractSnippet(userMessage);
    if (snippet) {
      await upsertUserMemory(supabase, userId, snippet);
    }

    return res.status(200).json({ reply });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
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









