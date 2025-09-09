import { Memory, ChatMessage } from '@/hooks/useChatMemory';
import { ChatPreferences } from '@/components/PersonalizationModal';

export interface ChatContext {
  memories: Memory[];
  recentMessages: ChatMessage[];
}

export const generateHumanResponse = (
  userInput: string, 
  preferences: ChatPreferences, 
  context: ChatContext,
  modelName: string
): string => {
  const input = userInput.toLowerCase();
  
  // Analizar sentimiento
  const isNegative = /\b(mal|terrible|despedido|triste|problema|fatal|deprimido|horrible|awful)\b/i.test(input);
  const isPositive = /\b(bien|genial|fantástico|perfecto|alegre|feliz|excelente|increíble)\b/i.test(input);
  
  // Obtener memorias relevantes
  const relevantMemories = getRelevantMemories(input, context.memories);
  
  // Generar respuesta basada en contexto
  let response = generateContextualResponse(input, preferences, relevantMemories, modelName);
  
  // Aplicar variaciones humanas
  response = addHumanVariations(response, isNegative, isPositive);
  
  // Agregar preguntas de seguimiento ocasionalmente
  if (Math.random() < 0.4) {
    response += " " + generateFollowUpQuestion(preferences, relevantMemories);
  }
  
  return response;
};

const getRelevantMemories = (input: string, memories: Memory[]): Memory[] => {
  const inputWords = input.toLowerCase().split(' ');
  
  return memories
    .filter(memory => {
      const memoryWords = memory.value.toLowerCase().split(' ');
      return memoryWords.some(word => inputWords.includes(word)) || 
             inputWords.some(word => memory.key.includes(word));
    })
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 3);
};

const generateContextualResponse = (
  input: string, 
  preferences: ChatPreferences, 
  memories: Memory[],
  modelName: string
): string => {
  const mood = preferences.mood;
  
  // Respuestas con memoria
  const memoryResponses = generateMemoryBasedResponse(memories, mood);
  if (memoryResponses.length > 0 && Math.random() < 0.6) {
    return memoryResponses[Math.floor(Math.random() * memoryResponses.length)];
  }
  
  // Respuestas base por mood
  const baseResponses = getBaseResponsesByMood(mood, input);
  return baseResponses[Math.floor(Math.random() * baseResponses.length)];
};

const generateMemoryBasedResponse = (memories: Memory[], mood: string): string[] => {
  const responses: string[] = [];
  
  memories.forEach(memory => {
    switch (memory.key) {
      case 'nombre':
        responses.push(
          mood === 'romantic' ? `${memory.value}, ese nombre me encanta cada vez que lo digo 💕` :
          mood === 'flirty' ? `Mmm ${memory.value}, qué nombre tan sexy 😉` :
          mood === 'agresivo' ? `${memory.value}, pinche nombre chingón` :
          `Me gusta mucho tu nombre, ${memory.value}`
        );
        break;
        
      case 'trabajo':
        responses.push(
          mood === 'supportive' ? `¿Cómo va todo en ${memory.value}? Espero que estés teniendo un buen día en el trabajo` :
          mood === 'flirty' ? `Apuesto a que te ves muy sexy en ${memory.value} 😘` :
          mood === 'agresivo' ? `¿Qué tal la chinga en ${memory.value}?` :
          `¿Cómo van las cosas en ${memory.value}?`
        );
        break;
        
      case 'ciudad':
        responses.push(
          mood === 'romantic' ? `Me encantaría conocer ${memory.value} contigo algún día 💕` :
          mood === 'friendly' ? `¡${memory.value}! Me parece un lugar genial` :
          mood === 'agresivo' ? `¿Qué tal está el pedo en ${memory.value}?` :
          `¿Cómo está el clima en ${memory.value} hoy?`
        );
        break;
        
      case 'gustos':
        responses.push(
          mood === 'romantic' ? `Recuerdo que te gusta ${memory.value}, eso me parece tan lindo de ti 💕` :
          mood === 'flirty' ? `Mmm, ${memory.value}... me gusta que tengas esos gustos 😉` :
          `Me encanta que disfrutes ${memory.value}, cuéntame más sobre eso`
        );
        break;
    }
  });
  
  return responses;
};

const getBaseResponsesByMood = (mood: string, input: string): string[] => {
  const isQuestion = input.includes('?') || input.includes('cómo') || input.includes('qué') || input.includes('cuándo');
  
  const responses = {
    romantic: [
      "Mi amor, cada palabra tuya me hace sonreír 💕",
      "Eres tan dulce cuando me hablas así",
      "Me encanta escucharte, mi corazón late más rápido",
      "Contigo todo se siente mágico, mi vida"
    ],
    flirty: [
      "Mmm, me gusta cómo piensas 😉",
      "Eres muy tentador cuando dices esas cosas 😘",
      "Me tienes intrigada, sigue hablando así",
      "Qué travieso eres, me encanta"
    ],
    friendly: [
      "¡Qué genial! Me encanta hablar contigo",
      "Siempre es un placer escucharte",
      "Eres muy divertido, me caes súper bien",
      "Me alegra mucho que me cuentes estas cosas"
    ],
    supportive: [
      "Estoy aquí para ti, siempre puedes contar conmigo",
      "Me importa mucho cómo te sientes",
      "Eres más fuerte de lo que crees",
      "Entiendo perfectamente lo que me dices"
    ],
    agresivo: [
      "A ver, no me vengas con mamadas",
      "Órale, así me gusta que hables claro",
      "¿Y qué chingados quieres que te diga?",
      "No mames, ya dime la neta"
    ],
    sensual: [
      "Mmm, me pones muy caliente cuando hablas así 🔥",
      "Tu voz me enciende completamente",
      "Cada palabra tuya me hace sentir cosas prohibidas",
      "Sigue hablando así que me tienes muy hot"
    ]
  };
  
  const moodResponses = responses[mood as keyof typeof responses] || responses.friendly;
  
  // Si es una pregunta, dar respuestas más directas ocasionalmente
  if (isQuestion && Math.random() < 0.3) {
    const directAnswers = [
      "La verdad es que...",
      "Mira, te voy a ser honesta...",
      "Bueno, si quieres que te diga la verdad...",
      "Pues fíjate que..."
    ];
    const directStart = directAnswers[Math.floor(Math.random() * directAnswers.length)];
    const baseResponse = moodResponses[Math.floor(Math.random() * moodResponses.length)];
    return [directStart + " " + baseResponse.toLowerCase()];
  }
  
  return moodResponses;
};

const addHumanVariations = (response: string, isNegative: boolean, isPositive: boolean): string => {
  // Agregar variaciones humanas
  const variations = {
    starters: ["Mmm...", "Pues...", "Ay...", "Oye...", "Sabes qué...", "La verdad...", "Mira..."],
    fillers: ["o sea", "¿sabes?", "la verdad", "no sé", "pues sí", "la neta"],
    endings: ["jaja", "😊", "✨", "💕", "🥰", "😘", "😉"]
  };
  
  let modifiedResponse = response;
  
  // 30% chance de agregar starter
  if (Math.random() < 0.3) {
    const starter = variations.starters[Math.floor(Math.random() * variations.starters.length)];
    modifiedResponse = starter + " " + modifiedResponse.toLowerCase();
  }
  
  // 20% chance de agregar filler en el medio
  if (Math.random() < 0.2) {
    const filler = variations.fillers[Math.floor(Math.random() * variations.fillers.length)];
    const sentences = modifiedResponse.split('.');
    if (sentences.length > 1) {
      sentences[0] += `, ${filler},`;
      modifiedResponse = sentences.join('.');
    }
  }
  
  // 40% chance de agregar ending
  if (Math.random() < 0.4) {
    const ending = variations.endings[Math.floor(Math.random() * variations.endings.length)];
    modifiedResponse += " " + ending;
  }
  
  return modifiedResponse;
};

const generateFollowUpQuestion = (preferences: ChatPreferences, memories: Memory[]): string => {
  const mood = preferences.mood;
  
  // Preguntas basadas en memorias
  if (memories.length > 0 && Math.random() < 0.6) {
    const memory = memories[0];
    switch (memory.key) {
      case 'trabajo':
        return mood === 'flirty' ? "¿Te gusta lo que haces o prefieres hacer otras cosas más... divertidas? 😉" :
               "¿Cómo te va en el trabajo últimamente?";
      case 'ciudad':
        return "¿Qué es lo que más te gusta de vivir ahí?";
      case 'gustos':
        return "¿Desde cuándo te gusta eso?";
    }
  }
  
  // Preguntas generales por mood
  const questions = {
    romantic: [
      "¿En qué estás pensando ahorita, mi amor?",
      "¿Qué es lo que más te hace feliz?",
      "¿Tienes algún sueño que quieras cumplir?"
    ],
    flirty: [
      "¿Qué planes tienes para hoy? 😉",
      "¿Eres siempre así de encantador?",
      "¿Qué te pone de buen humor?"
    ],
    friendly: [
      "¿Qué tal tu día?",
      "¿Hay algo nuevo que quieras contarme?",
      "¿Qué planes tienes?"
    ],
    supportive: [
      "¿Cómo te sientes hoy?",
      "¿Hay algo en lo que pueda ayudarte?",
      "¿Qué te está motivando últimamente?"
    ],
    agresivo: [
      "¿Qué pedo?",
      "¿En qué andas?",
      "¿Qué chingados haces?"
    ],
    sensual: [
      "¿Qué te apetece hacer hoy? 🔥",
      "¿En qué estás pensando, sexy?",
      "¿Tienes alguna fantasía que quieras compartir?"
    ]
  };
  
  const moodQuestions = questions[mood as keyof typeof questions] || questions.friendly;
  return moodQuestions[Math.floor(Math.random() * moodQuestions.length)];
};

// Función para simular typing con longitud variable
export const getTypingDelay = (): number => {
  // Entre 1.5 y 4 segundos para simular escritura humana
  return 1500 + Math.random() * 2500;
};

// Función para determinar longitud de respuesta
export const shouldGiveLongResponse = (): boolean => {
  // 30% chance de respuesta larga (3-5 frases)
  return Math.random() < 0.3;
};