import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

  // Cargar/crear conversación persistente si tenemos userId+modelId
  useEffect(() => {
    const setup = async () => {
      if (!userId || !modelId) return; // compatibilidad: modo local
      try {
        setIsLoading(true);
        // upsert conversación (única por user/model)
        const { data: convData, error: convErr } = await supabase
          .from('conversations')
          .upsert(
            { user_id: userId, model_id: String(modelId) },
            { onConflict: 'user_id,model_id' }
          )
          .select('*')
          .single();

        if (convErr) {
          console.error('❌ upsert conversation error:', convErr);
          return;
        }

        setConversationId(convData.id);
        setMemorySummary(convData.memory_summary || '');

        // cargar últimos 100 mensajes
        const { data: msgs, error: msgsErr } = await supabase
          .from('messages')
          .select('id, role, content, created_at')
          .eq('conversation_id', convData.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (msgsErr) {
          console.error('❌ load messages error:', msgsErr);
        } else {
          const mapped: ChatMessage[] = (msgs || []).map((m: any) => ({
            id: m.id,
            text: m.content,
            isUser: m.role === 'user',
            timestamp: new Date(m.created_at),
          }));
          setMessages(mapped);
        }

        // contador últimas 24h (coherente con las reglas del servidor)
        try {
          const { data: countRes, error: countErr } = await supabase
            .rpc('count_user_messages', { u_id: userId });
          if (!countErr && typeof countRes === 'number') {
            setDailyCount(countRes);
          }
        } catch {}
      } finally {
        setIsLoading(false);
      }
    };
    setup();
  }, [userId, modelId]);

  // Insertar mensaje también en Supabase (si hay conversación)
  const persistMessage = useCallback(async (message: ChatMessage) => {
    if (!conversationId) return;
    try {
      // Persistimos solo los mensajes del usuario; las respuestas del bot no cuentan para límite
      if (message.isUser) {
        const { error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            content: message.text,
          });
        if (error) {
          if ((error as any).code === '42501' || (error as any).message?.includes('policy')) {
            setLimitReached(true);
          }
          console.error('❌ insert message error:', error);
        } else {
          setDailyCount(prev => prev + 1);
        }
      }
      
      if (message.isUser) {
        // actualización simple de memoria cada 8 mensajes del usuario
        const userMessages = [...messages, message].filter(m => m.isUser);
        if (userMessages.length % 8 === 0) {
          const lastWindow = [...messages, message].slice(-20)
            .map(m => `${m.isUser ? 'Usuario' : 'Modelo'}: ${m.text}`)
            .join(' \n');
          const newSummary = `Notas acumuladas: recuerda gustos, temas y promesas. Últimos temas clave:\n${lastWindow}`;
          try {
            await supabase
              .from('conversations')
              .update({ memory_summary: newSummary })
              .eq('id', conversationId);
            setMemorySummary(newSummary);
          } catch {}
        }
      }
    } catch (e) {
      console.error('❌ persistMessage exception:', e);
    }
  }, [conversationId]);

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





