export type Emotion = 'feliz' | 'triste' | 'nervioso' | 'enojado' | 'cariñoso' | 'neutro';

const KEYWORDS: Record<Emotion, string[]> = {
  feliz: ['bien', 'genial', 'content', 'feliz', 'alegr', 'perfecto', 'mejor'],
  triste: ['mal', 'triste', 'fatal', 'deprim', 'llor', 'pena'],
  nervioso: ['nervios', 'ansios', 'preocup', 'tenso', 'estres'],
  enojado: ['enfad', 'enoj', 'cabread', 'rabia', 'molest'],
  cariñoso: ['te quiero', 'me gustas', 'me encantas', 'cariño', 'amor'],
  neutro: [],
};

export function detectEmotion(text: string): Emotion {
  const lower = (text || '').toLowerCase();
  for (const [emo, list] of Object.entries(KEYWORDS) as [Emotion, string[]][]) {
    if (emo === 'neutro') continue;
    if (list.some((k) => lower.includes(k))) return emo;
  }
  return 'neutro';
}









