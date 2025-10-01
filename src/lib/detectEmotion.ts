export type Emotion = 'feliz' | 'triste' | 'nervioso' | 'enfadado' | 'cariñoso' | 'neutro';

const RULES: Record<Emotion, string[]> = {
  feliz: ['bien', 'genial', 'feliz', 'content', 'alegr', 'perfecto'],
  triste: ['mal', 'triste', 'fatal', 'deprim', 'llor', 'pena'],
  nervioso: ['nervios', 'ansios', 'preocup', 'tenso', 'estres'],
  enfadado: ['enfad', 'enoj', 'cabread', 'rabia', 'molest'],
  cariñoso: ['te quiero', 'me gustas', 'me encantas', 'cariño', 'amor'],
  neutro: [],
};

export async function detectEmotion(text: string): Promise<Emotion> {
  const lower = (text || '').toLowerCase();
  for (const [emo, keys] of Object.entries(RULES) as [Emotion, string[]][]) {
    if (emo === 'neutro') continue;
    if (keys.some((k) => lower.includes(k))) return emo;
  }
  return 'neutro';
}









