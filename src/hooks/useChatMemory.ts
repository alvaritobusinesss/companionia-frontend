import { useState, useEffect } from 'react';

export interface Memory {
  key: string;
  value: string;
  importance: number;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface UserMemory {
  modelId: string;
  memories: Memory[];
  recentMessages: ChatMessage[];
}

export const useChatMemory = (modelId: string) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);

  // Cargar memoria del localStorage
  useEffect(() => {
    const savedMemory = localStorage.getItem(`chat_memory_${modelId}`);
    if (savedMemory) {
      try {
        const parsed: UserMemory = JSON.parse(savedMemory);
        setMemories(parsed.memories || []);
        setRecentMessages(parsed.recentMessages || []);
      } catch (error) {
        console.error('Error parsing saved memory:', error);
      }
    }
  }, [modelId]);

  // Guardar memoria en localStorage
  const saveMemory = (newMemories: Memory[], newMessages: ChatMessage[]) => {
    const userMemory: UserMemory = {
      modelId,
      memories: newMemories.slice(-10), // Máximo 10 memorias
      recentMessages: newMessages.slice(-20) // Últimos 20 mensajes
    };
    localStorage.setItem(`chat_memory_${modelId}`, JSON.stringify(userMemory));
  };

  // Extraer información personal del mensaje usando regex
  const extractMemories = (message: string): Memory[] => {
    const newMemories: Memory[] = [];
    const now = new Date();

    // Patrones para extraer información
    const patterns = [
      { regex: /me llamo ([^.,!?]+)/i, key: 'nombre', importance: 10 },
      { regex: /mi nombre es ([^.,!?]+)/i, key: 'nombre', importance: 10 },
      { regex: /soy ([^.,!?]+)/i, key: 'descripcion', importance: 7 },
      { regex: /vivo en ([^.,!?]+)/i, key: 'ciudad', importance: 9 },
      { regex: /trabajo (?:de|como|en) ([^.,!?]+)/i, key: 'trabajo', importance: 8 },
      { regex: /me gusta ([^.,!?]+)/i, key: 'gustos', importance: 6 },
      { regex: /mi hobby es ([^.,!?]+)/i, key: 'hobby', importance: 7 },
      { regex: /tengo (\d+) años/i, key: 'edad', importance: 8 },
      { regex: /estoy (?:triste|deprimido|mal)/i, key: 'estado_emocional', importance: 5, value: 'triste' },
      { regex: /estoy (?:feliz|contento|bien)/i, key: 'estado_emocional', importance: 5, value: 'feliz' },
      { regex: /mañana (?:voy a|tengo) ([^.,!?]+)/i, key: 'evento_cercano', importance: 8 },
      { regex: /el (?:lunes|martes|miércoles|jueves|viernes|sábado|domingo) ([^.,!?]+)/i, key: 'evento_semanal', importance: 6 }
    ];

    patterns.forEach(pattern => {
      const match = message.match(pattern.regex);
      if (match) {
        const value = pattern.value || match[1]?.trim();
        if (value) {
          newMemories.push({
            key: pattern.key,
            value,
            importance: pattern.importance,
            timestamp: now
          });
        }
      }
    });

    return newMemories;
  };

  // Agregar mensaje y extraer memorias
  const addMessage = (message: ChatMessage) => {
    const newMessages = [...recentMessages, message];
    setRecentMessages(newMessages);

    if (message.isUser) {
      const extractedMemories = extractMemories(message.text);
      if (extractedMemories.length > 0) {
        const updatedMemories = [...memories];
        
        extractedMemories.forEach(newMemory => {
          // Reemplazar memoria existente del mismo tipo o agregar nueva
          const existingIndex = updatedMemories.findIndex(m => m.key === newMemory.key);
          if (existingIndex >= 0) {
            updatedMemories[existingIndex] = newMemory;
          } else {
            updatedMemories.push(newMemory);
          }
        });

        // Mantener solo las 10 memorias más importantes
        const sortedMemories = updatedMemories
          .sort((a, b) => b.importance - a.importance)
          .slice(0, 10);
        
        setMemories(sortedMemories);
        saveMemory(sortedMemories, newMessages);
      } else {
        saveMemory(memories, newMessages);
      }
    } else {
      saveMemory(memories, newMessages);
    }
  };

  // Obtener contexto para la IA
  const getContextForAI = () => {
    const topMemories = memories
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
    
    const recentContext = recentMessages.slice(-10);
    
    return {
      memories: topMemories,
      recentMessages: recentContext
    };
  };

  return {
    memories,
    recentMessages,
    addMessage,
    getContextForAI
  };
};