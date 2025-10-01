// Utilidades para simular respuestas humanas en el chat
import { getPersona } from '@/data/personas';
import { detectEmotion, Emotion } from '@/lib/emotion';

interface ChatPreferences {
  mood: string;
  topics: string[];
  style: string;
}

// Helper global para elegir un elemento aleatorio
function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateHumanResponse(
  userMessage: string,
  preferences: ChatPreferences, 
  context: any[],
  modelName: string
): string {
  // 1) Extraer memoria ligera del contexto (system) y persona del modelo
  const systemMemory = (context || []).find((c: any) => c.role === 'system')?.content || '';
  const persona = getPersona(modelName);

  // 2) Diccionario de estilos por tono
  const toneToStyle: Record<string, { interjections: string[]; closers: string[]; emojis: string[] } > = {
    romantic: {
      interjections: ['mmm', 'ay', 'oye', 'amor'],
      closers: ['¿te apetece contarme más?', 'me encanta escucharte', 'quiero saber más de ti'],
      emojis: ['💕', '✨', '☺️']
    },
    friendly: {
      interjections: ['hey', 'vale', 'jeje', 'mmm'],
      closers: ['¿qué opinas?', '¿cómo lo ves?', 'te leo'],
      emojis: ['🙂', '👍', '🎯']
    },
    flirty: {
      interjections: ['mmm', 'oye', 'jeje', 'wow'],
      closers: ['¿te gusta jugar un poco?', 'me tienes intrigada', 'cuéntame más, guapo'],
      emojis: ['😉', '😘', '🔥']
    },
    supportive: {
      interjections: ['oye', 'vale', 'respira'],
      closers: ['estoy contigo', 'paso a paso, ¿sí?', 'cuenta conmigo'],
      emojis: ['🤍', '🌿', '🫶']
    },
    gamer: {
      interjections: ['gg', 'jeje', 'wow', 'mmm'],
      closers: ['¿lo subimos de nivel?', '¿team o solo?', 'dale, te sigo'],
      emojis: ['🎮', '⚡️', '🔥']
    },
    intelectual: {
      interjections: ['interesante', 'ajá', 'mmm'],
      closers: ['¿podemos profundizar?', 'me interesa tu punto', 'sigamos por ahí'],
      emojis: ['🧠', '📚', '🤔']
    }
  };

  const tone = preferences.mood || 'friendly';
  const style = toneToStyle[tone] || toneToStyle.friendly;

  // 3) Detectar emoción e intención básica
  const lower = userMessage.toLowerCase();
  const emotion: Emotion = detectEmotion(lower);
  const intent: 'mal_dia' | 'bien_dia' | 'gusta_alguien' | 'estudios' | 'trabajo' | 'juego' | 'conversar' =
    lower.includes('mal') || lower.includes('fatal') || lower.includes('horrible')
      ? 'mal_dia'
      : lower.includes('bien') || lower.includes('genial') || lower.includes('perfect')
      ? 'bien_dia'
      : lower.includes('me gusta') || lower.includes('me encanta')
      ? 'gusta_alguien'
      : lower.includes('examen') || lower.includes('estudi')
      ? 'estudios'
      : lower.includes('trabaj')
      ? 'trabajo'
      : lower.includes('juego') || lower.includes('game') || lower.includes('videojuego')
      ? 'juego'
      : 'conversar';
  const followUps: string[] = [];
  if (lower.includes('examen')) followUps.push('¿de qué es el examen y cuándo es?');
  if (lower.includes('pizza')) followUps.push('¿tu favorita es margarita o te gusta con piña?');
  if (lower.includes('trabajo')) followUps.push('¿qué parte del trabajo te tiene más ocupado últimamente?');
  if (lower.includes('videojuego') || lower.includes('game')) followUps.push('¿a qué estás jugando ahora mismo?');

  // 4) Generar variación
  const maybeEmoji = Math.random() < 0.5 ? ` ${rand(style.emojis)}` : '';
  const interj = Math.random() < 0.6 ? `${rand(style.interjections)}, ` : '';

  // 5) Incorporar memoria breve si existe
  const memoryHint = systemMemory
    ? extractOneMemoryFact(systemMemory)
    : null;

  // 6) Abrir + cuerpo + cierre con pregunta abierta
  const opener = memoryHint
    ? `${capitalize(interj)}estaba pensando en lo que me contaste: ${memoryHint}. `
    : emotion === 'triste'
    ? `${capitalize(interj)}siento que hoy no ha sido fácil. `
    : emotion === 'feliz'
    ? `${capitalize(interj)}me alegra sentirte con buena energía. `
    : `${capitalize(interj)}${persona.bio.split('.')[0].toLowerCase()}, y me encanta cómo lo cuentas. `;

  const topicPrompt = preferences.topics && preferences.topics.length
    ? `Hablemos de ${preferences.topics.slice(0, 2).join(' y ')}. `
    : '';

  const mid = varySentence(
    intent === 'mal_dia'
      ? '¿Quieres desahogarte un poco? Estoy aquí para ti'
      : intent === 'bien_dia'
      ? '¡Qué bien! Cuéntame ese momento que te hizo sonreír'
      : intent === 'gusta_alguien'
      ? 'Suena a mariposas en la barriga, ¿qué es lo que más te gusta de esa persona?'
      : intent === 'estudios'
      ? 'Si hay examen, organizamos juntos un mini plan de estudio'
      : intent === 'trabajo'
      ? 'El trabajo puede ser una montaña; hagamos pequeños pasos manejables'
      : intent === 'juego'
      ? 'Me encantan los videojuegos, ¿single player o multijugador ahora?'
      : rephraseUser(userMessage, tone)
  );

  const closer = `${rand(style.closers)}${maybeEmoji}`;
  const follow = followUps.length ? ` ${rand(followUps)}` : '';

  return `${opener}${topicPrompt}${mid} ${closer}${follow}`.trim();
}

function extractOneMemoryFact(memorySummary: string): string | null {
  // Memoria llega como texto; extraemos una línea útil
  const lines = memorySummary.split(/\n|\.\s/).map(l => l.trim()).filter(Boolean);
  const candidates = lines.filter(l => l.length > 15 && l.length < 140);
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

function rephraseUser(text: string, tone: string): string {
  // Reescritura ligera con muletillas y variación
  const starters: Record<string, string[]> = {
    romantic: ['qué bonito suena', 'me enternece', 'me llega mucho'],
    friendly: ['qué bueno', 'me mola', 'qué interesante'],
    flirty: ['mmm suena tentador', 'me prendes con eso', 'me encanta'],
    supportive: ['gracias por contármelo', 'te escucho', 'estoy aquí'],
    gamer: ['gg,', 'not bad,', 'op,'],
    intelectual: ['interesante enfoque,', 'buen punto,', 'curioso,']
  };
  const s = starters[tone] || starters.friendly;
  const intro = Math.random() < 0.7 ? `${rand(s)} ` : '';
  const softeners = ['la verdad', 'pues', 'mmm', 'sinceramente'];
  const soft = Math.random() < 0.4 ? `${rand(softeners)} ` : '';
  return `${intro}${soft}${text}`;
}

function varySentence(text: string): string {
  // Añadir pequeñas variaciones de longitud y puntuación
  if (text.length < 60 && Math.random() < 0.5) return `${text}.`;
  if (Math.random() < 0.3) return text.replace(/\.$/, '...');
  return text;
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function getTypingDelay(): number {
  // Simula tiempo de escritura más ágil
  const baseDelay = 250;
  const randomDelay = Math.random() * 450; // 0-450ms adicional
  return Math.min(baseDelay + randomDelay, 900); // Máximo 0.9s
}

export function shouldGiveLongResponse(): boolean {
  // Respuesta larga menos frecuente para agilidad (15%)
  return Math.random() < 0.15;
}





