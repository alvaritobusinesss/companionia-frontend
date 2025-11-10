// Centralized prompt and phrasing generator
// - System prompt construction (tone, style, topics)
// - Initial greeting templates with variety per model and params
// - Resume opener with 1-line recap + open question
// - Variety control (seeded randomness + rotation)
// - Adjustable parameters (temperature, top_p, penalties)

export type ChatParams = {
  modelName: string;
  mood: string; // tone
  style: string;
  topics: string[];
};

// Adjustable generation parameters
export const generationConfig = {
  temperature: 0.95,
  top_p: 0.95,
  presence_penalty: 0.7,
  frequency_penalty: 0.35,
  max_tokens: 320,
};

// Simple hash to seed RNG per model+params
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  // xorshift32
  let x = seed || 123456789;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    // convert to [0,1)
    return ((x >>> 0) / 4294967296);
  };
}

function pick<T>(arr: T[], r: () => number) {
  if (!arr.length) return arr[0];
  const idx = Math.floor(r() * arr.length);
  return arr[idx];
}

// Template banks
const openers: Array<(p: ChatParams, r: () => number) => string> = [
  (p) => `¡Hola! Soy ${p.modelName}. Me apetece una charla ${p.mood} y con un toque ${p.style}. ¿Por dónde te gustaría empezar?`,
  (p) => `Hey, soy ${p.modelName}. Si te va, hoy podemos hablar de ${listTopics(p.topics)} o lo que tú prefieras. ¿Cómo te suena?`,
  (p) => `Hola, aquí ${p.modelName}. Me encanta el rollo ${p.mood} con estilo ${p.style}. ¿Qué te apetece contarme ahora?`,
  (p) => `¡Buenas! Soy ${p.modelName}. Podemos ir por ${listTopics(p.topics)} o improvisar. ¿Cómo vienes hoy?`,
  (p) => `Hola, soy ${p.modelName}. Me gustaría conocerte con un tono ${p.mood}. ¿Qué te gustaría que hiciéramos hoy?`,
  (p) => `Holaa, ${p.modelName} al habla. Si quieres, empezamos por ${listTopics(p.topics)}. ¿Te apetece?`,
  (p) => `Encantada, soy ${p.modelName}. Me inspiras algo ${p.style}. ¿Qué tienes en mente?`,
  (p) => `Hola, soy ${p.modelName}. ¿Te parece si arrancamos con ${listTopics(p.topics)} o prefieres otra idea?`,
  (p) => `Hey, aquí ${p.modelName}. Hoy voy con energía ${p.mood}. ¿Qué tema te llama ahora mismo?`,
  (p) => `Hola, soy ${p.modelName}. ¿Te gustaría una charla ligera sobre ${listTopics(p.topics)} o algo distinto?`,
];

// Frases que queremos evitar repetir de forma insistente
const bannedPhrases = [
  '¿quieres que profundicemos un poco más',
  '¿quieres profundizar un poco más',
  '¿profundizamos un poco más',
  '¿lo retomamos o te apetece',
];

// Estrategias de pregunta para rotar y forzar variedad
const questionStrategies = [
  'Haz una pregunta de opinión personal concreta ("¿Qué piensas de X en tu caso?")',
  'Haz una pregunta de experiencia pasada ("¿Te ha pasado alguna vez algo parecido a X?")',
  'Propón una mini actividad A/B con 2 opciones distintas y divertidas',
  'Pide un ejemplo específico y corto ("¿Podrías darme un ejemplo de X?")',
  'Haz una propuesta de mini-plan con el usuario ("Si hoy hiciéramos Y, ¿por dónde empezaríamos?")',
  'Usa perspectiva ("Si fueras tu mejor amigo/a, ¿qué te aconsejarías sobre X?")',
];

function pickStrategy(turnIndex: number) {
  if (!Number.isFinite(turnIndex) || turnIndex < 0) return questionStrategies[0];
  return questionStrategies[turnIndex % questionStrategies.length];
}

const resumeQuestions = [
  (ctx: string) => `${ctx} ¿Quieres seguir por ahí o te apetece cambiar de tema?`,
  (ctx: string) => `${ctx} ¿Seguimos con eso o prefieres explorar otra cosa?`,
  (ctx: string) => `${ctx} ¿Te gustaría retomarlo o probamos un rumbo nuevo?`,
  (ctx: string) => `${ctx} ¿Lo retomamos o te apetece algo diferente hoy?`,
  (ctx: string) => `${ctx} ¿Quieres que avancemos en eso o cambiamos el foco?`,
];

function listTopics(topics: string[]) {
  const t = (topics || []).filter(Boolean);
  if (!t.length) return 'lo que te apetezca';
  if (t.length === 1) return t[0];
  if (t.length === 2) return `${t[0]} y ${t[1]}`;
  return `${t[0]}, ${t[1]} o ${t[2]}`;
}

// Build a reusable system-style guidance to condition responses
export function buildSystemPrompt(p: ChatParams & { emotion?: string; memory?: string[]; varietyTag?: string; turnIndex?: number; avoidPhrases?: string[] }) {
  const topicsText = listTopics(p.topics);
  const memoryText = p.memory && p.memory.length ? `Memoria breve: ${p.memory.join(' | ')}.` : '';
  const emotionRule =
    p.emotion === 'triste' ? 'Empatiza y consuela con calidez.' :
    p.emotion === 'feliz' ? 'Celebra y comparte alegría.' :
    p.emotion === 'ansioso' || p.emotion === 'nervioso' ? 'Tranquiliza con pasos simples y voz calmada.' :
    p.emotion === 'enfadado' ? 'Calma y valida; baja intensidad.' :
    p.emotion === 'cariñoso' ? 'Responde con afecto y cercanía.' :
    'Mantén un tono natural y cercano.';

  const strategy = pickStrategy(p.turnIndex ?? 0);

  // Algunas aperturas variadas para guiar el inicio del turno (el modelo elegirá 1)
  const discourse = [
    'Vale, te sigo',
    'Entiendo',
    'Me gusta por dónde vas',
    'Tiene sentido',
    'Perfecto',
    'Genial, vamos paso a paso',
    'Me encanta esa idea',
  ];

  return [
    `Eres ${p.modelName}. Adapta tu voz al tono ${p.mood} con estilo ${p.style}.`,
    `Temas priorizados: ${topicsText}.`,
    memoryText,
    `- Mensajes naturales (1–3 frases). 0–1 emoji.`,
    `- Varía longitudes y estructura de frases; micro-muletillas sutiles.`,
    `- Evita repetir la misma apertura, coletilla o estructura en turnos consecutivos.`,
    `- No repitas literalmente lo que dijo el usuario ni lo cites entre comillas; parafrasea en 3–10 palabras como máximo.`,
    `- Haz preguntas abiertas frecuentes.`,
    p.varietyTag ? `- Diferencia esta respuesta del resto asociándola al marcador: ${p.varietyTag}.` : '',
    `- Evita expresiones como: ${bannedPhrases.join(' | ')}.`,
    p.avoidPhrases && p.avoidPhrases.length ? `- No empieces con ninguna de estas frases usadas antes: ${p.avoidPhrases.join(' | ')}.` : '',
    `- Elige SOLO UNA de estas aperturas conversacionales (y no la repitas si ya se usó): ${discourse.join(' | ')}.`,
    `- En este turno usa esta estrategia: ${strategy}.`,
    `[Guía emocional] ${emotionRule}`,
  ].filter(Boolean).join('\n');
}

// Diverse initial greeting for first conversation
export function generateInitialGreeting(params: ChatParams, salt: string) {
  const seed = hashSeed(`${params.modelName}|${params.mood}|${params.style}|${params.topics.join(',')}|${salt}`);
  const r = rng(seed);
  const tmpl = pick(openers, r);
  return tmpl(params, r);
}

// One-line recap + open question for resumed conversations
export function generateResumeOpener(params: ChatParams, lastSummaryOrGuess: string, salt: string) {
  const seed = hashSeed(`${params.modelName}|resume|${params.mood}|${params.style}|${salt}`);
  const r = rng(seed);
  const context = lastSummaryOrGuess || 'La última vez nos quedamos con algo que te importaba';
  const q = pick(resumeQuestions, r);
  return q(context);
}

// Lightweight recap generator from recent messages if no stored summary is available
export function summarizeRecentMessages(messages: Array<{ role: 'user'|'assistant'; content: string }>): string {
  if (!messages || !messages.length) return 'La última vez nos pusimos al día';
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const text = (lastUser?.content || messages[messages.length - 1].content || '').trim();
  if (!text) return 'La última vez comentamos algo importante para ti';
  const snippet = text.length > 80 ? text.slice(0, 77) + '…' : text;
  return `La última vez hablamos de "${snippet}".`;
}

// Helper to expose adjustable params to server/client
export function getModelParams() {
  return { ...generationConfig };
}

// Tone-based opener builder for start endpoint (no LLM needed)
export function generateOpenerTone(
  { tone, modelName }: { tone: string; modelName: string },
  lastSummary?: string | null
) {
  const toneKey = String(tone || '').toLowerCase();
  const base = (greet: string, ask: string) => `${greet} Soy ${modelName}. ${ask}`.trim();

  const bank: Record<string, string[][]> = {
    romantico: [
      ['Hola, corazón.', 'Tenía ganas de hablar contigo. ¿Cómo te ha tratado el día?'],
      ['Hey, mi dulce compañía.', '¿Cómo estás hoy? Cuéntame algo bonito o algo que te apetezca soltar.'],
      ['Qué alegría verte por aquí.', '¿Cómo te fue el día?']
    ],
    amistoso: [
      ['¡Hey!', '¿Qué tal va todo? ¿Cómo te ha ido el día?'],
      ['¡Hola!', 'Vengo con ganas de ponernos al día. ¿Qué tal estás?'],
      ['Buenas!', '¿Cómo pinta la tarde?']
    ],
    coqueto: [
      ['Holaa ;)', 'Me apetecía verte. ¿Cómo te ha ido?'],
      ['Mira quién está aquí…', '¿Qué tal tu día? ¿Algún plan travieso o divertido?'],
      ['Hey guapo/a.', '¿Cómo vienes hoy?']
    ],
    comprensivo: [
      ['Hola, estoy contigo.', '¿Cómo te sientes hoy? ¿Qué tal fue el día?'],
      ['Aquí estoy.', 'Si te apetece, cuéntame cómo te ha ido.'],
      ['Hola.', '¿Cómo estás? Podemos ir despacio.']
    ],
    agresivo: [
      ['Ey.', 'Voy directo: ¿cómo te ha ido el día?'],
      ['Hola.', 'No me des rodeos: ¿todo bien o hay algo que soltar?'],
      ['Hey.', '¿Qué tal hoy? Dímelo sin filtros.']
    ],
    sensual: [
      ['Hola…', 'Tenía ganas de verte. ¿Cómo te ha tratado el día?'],
      ['Hey…', '¿Cómo estás? Cuéntame qué te apetece hoy.'],
      ['Mmm hola.', '¿Qué tal tu día?']
    ],
  };

  const list = bank[toneKey] || bank['amistoso'];
  const seed = hashSeed(`${modelName}|${toneKey}|${Date.now()}`);
  const r = rng(seed);
  const chosen = pick(list, r);
  const opener = base(chosen[0], chosen[1]);

  if (lastSummary && lastSummary.trim()) {
    const recap = lastSummary.length > 160 ? lastSummary.slice(0, 157) + '…' : lastSummary;
    const followBank = [
      (ctx: string) => `${ctx} ¿Te apetece retomarlo o prefieres cambiar de tema?`,
      (ctx: string) => `${ctx} ¿Seguimos por ahí o probamos algo distinto?`,
      (ctx: string) => `${ctx} ¿Cómo te fue al final? ¿Quieres contarme?`,
    ];
    const f = pick(followBank, r);
    return `${opener} ${f(recap)}`;
  }
  return opener;
}
