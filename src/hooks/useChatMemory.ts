import { useState, useCallback, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function useChatMemory(sessionKey?: string, userId?: string, modelId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [memorySummary, setMemorySummary] = useState<string>('');
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [limitReached, setLimitReached] = useState<boolean>(false);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Obtener mensajes recientes (últimos 10)
  const recentMessages = messages.slice(-10);

  // Obtener contexto para la IA (últimos 5 mensajes)
  const getContextForAI = useCallback(() => {
    const recent = messages.slice(-5).map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    }));
    if (memorySummary) {
      return [
        { role: 'system', content: `Memoria de largo plazo: ${memorySummary}` },
        ...recent,
      ];
    }
    return recent;
  }, [messages]);

  // Sin Supabase: inicialización rápida solo local
  useEffect(() => {
    setIsLoading(false);
  }, [userId, modelId]);

  // Insertar mensaje también en Supabase (si hay conversación)
  const persistMessage = useCallback(async (_message: ChatMessage) => {
    // Sin persistencia remota
    return;
  }, []);

  // proxy que añade local y persiste
  const addMessagePersist = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    persistMessage(message);
  }, [persistMessage]);

  return {
    messages,
    recentMessages,
    isLoading,
    addMessage: conversationId ? addMessagePersist : addMessage,
    clearMessages,
    setIsLoading,
    getContextForAI,
    dailyCount,
    dailyLimit: 20,
    limitReached,
    remainingMessages: Math.max(0, 20 - dailyCount),
  };
}





