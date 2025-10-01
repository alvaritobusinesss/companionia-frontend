import { getPersona } from '@/data/personas';

type Prefs = { mood: string; topics: string[]; style?: string };

export async function generateAIReply({
  userMessage,
  modelName,
  preferences,
  context,
  memorySummary,
}: {
  userMessage: string;
  modelName: string;
  preferences: Prefs;
  context: { role: 'user' | 'assistant'; content: string }[];
  memorySummary?: string;
}): Promise<string | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) return null;

  const persona = getPersona(modelName);

  const system = [
    `Eres ${modelName}. Personalidad: ${persona.bio}. Rasgos: ${persona.traits.join(', ')}. Muletillas permitidas: ${persona.fillers.join(', ')}.`,
    `Respeta el modo del usuario: ${preferences.mood}. Temas preferidos: ${preferences.topics?.join(', ') || 'libres'}.`,
    `Estilo: frases naturales, 70-120 palabras, 0-1 emoji, 0-1 muletilla. No repitas plantillas.`,
    memorySummary ? `Memoria del usuario: ${memorySummary}` : '',
    `Estructura: 1) Empatiza y valida; 2) referencia concreta a lo dicho; 3) propón avance/idea/plan; 4) cierra con pregunta abierta.`,
  ]
    .filter(Boolean)
    .join('\n');

  const messages = [
    { role: 'system', content: system },
    ...(context || []).slice(-8),
    { role: 'user', content: userMessage },
  ];

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 220,
        messages,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}









