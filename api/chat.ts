import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Función para detectar emoción del último mensaje
function detectEmotion(text: string): string {
  const t = (text || '').toLowerCase();
  if (/(triste|fatal|deprim|mal|horrible|terrible)/.test(t)) return 'triste';
  if (/(feliz|genial|content|bien|increíble|fantástico)/.test(t)) return 'feliz';
  if (/(nerv|ansios|preocup|tenso|estres|miedo)/.test(t)) return 'ansioso';
  if (/(enfad|enoj|cabread|rabia|molest|odio)/.test(t)) return 'enfadado';
  if (/(te quiero|me gustas|me encantas|amor|beso|abrazo)/.test(t)) return 'cariñoso';
  return 'neutro';
}

// Función para obtener memoria del usuario
async function getUserMemory(userId: string): Promise<string[]> {
  // TODO: Implementar con Supabase
  return [];
}

// Función para construir el system prompt
function buildSystemPrompt({
  modelName,
  modelPersona,
  tone,
  topics,
  style,
  emotion,
  memory
}: {
  modelName: string;
  modelPersona: string;
  tone: string;
  topics: string[];
  style: string;
  emotion: string;
  memory: string[];
}): string {
  const topicsText = topics.join(', ');
  const memoryText = memory.length > 0 ? `\n\nMemoria: ${memory.join('; ')}.` : '';
  
  const emotionGuidance = {
    triste: 'Empatiza y consuela con calidez.',
    feliz: 'Celebra y comparte la alegría.',
    ansioso: 'Tranquiliza con pasos simples y apoyo.',
    enfadado: 'Calma y valida los sentimientos.',
    cariñoso: 'Responde con afecto y cercanía.',
    neutro: 'Mantén un tono natural y cercano.'
  };

  const toneGuidance = {
    romántica: 'Sé cálida, cercana y dulce. Usa lenguaje afectuoso.',
    divertida: 'Sé juguetona, optimista y desenfadada. Usa humor sutil.',
    hot: 'Sé sensual, atrevida y sugerente. Mantén la elegancia.',
    gamer: 'Sé técnica, competitiva y entusiasta. Usa terminología gaming.',
    intelectual: 'Sé reflexiva, profunda y analítica. Usa lenguaje sofisticado.'
  };

  return `Eres ${modelName}. Personalidad base: ${modelPersona}.
Modo elegido por el usuario: ${tone}. Temas preferidos: ${topicsText}. Matiz de estilo: ${style}.

Habla de forma humana y natural:
- Varía la longitud de frases (cortas y largas)
- Usa muletillas suaves ("jeje", "mmm", "pues") con moderación
- Máximo 2 emojis si encajan naturalmente
- Refiere a declaraciones específicas del usuario
- Haz preguntas naturales de seguimiento ocasionalmente
- Evita plantillas y repeticiones
- Responde en 1-3 frases por defecto (expande si piden detalles)

${toneGuidance[tone as keyof typeof toneGuidance] || 'Mantén un tono natural y cercano.'}

${emotionGuidance[emotion as keyof typeof emotionGuidance] || 'Mantén un tono natural y cercano.'}

${memoryText}

No inventes datos ni recuerdos. Si encaja de forma natural, puedes recordar información previa.`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, tone, topics, style, modelName, modelPersona, userId } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Detectar emoción del último mensaje del usuario
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const emotion = lastUserMessage ? detectEmotion(lastUserMessage.content) : 'neutro';

    // Obtener memoria del usuario
    const memory = await getUserMemory(userId || '');

    // Construir system prompt
    const systemPrompt = buildSystemPrompt({
      modelName: modelName || 'Asistente',
      modelPersona: modelPersona || 'Amigable y servicial',
      tone: tone || 'natural',
      topics: topics || [],
      style: style || 'natural',
      emotion,
      memory
    });

    // Truncar historial a últimos 16 mensajes (8 turnos)
    const recentMessages = messages.slice(-16);

    // Preparar mensajes para OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages
    ];

    // Llamar a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      temperature: 0.8,
      top_p: 0.9,
      presence_penalty: 0.2,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content || 'Lo siento, no puedo responder en este momento.';

    return NextResponse.json({ 
      reply: response,
      emotion,
      memorySnippet: null // TODO: Implementar extracción de snippets
    });

  } catch (error) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}