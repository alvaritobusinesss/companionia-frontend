import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  user_id: string;
  model_id: string;
  model_name: string;
  messages: Message[];
  preferences: any;
  created_at: string;
  updated_at: string;
}

export function useConversation(userId: string | undefined, modelId: string, modelName: string) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar conversación existente
  useEffect(() => {
    if (!userId || !modelId) {
      setLoading(false);
      return;
    }

    async function loadConversation() {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .eq('model_id', modelId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Error loading conversation:', error);
        } else if (data) {
          // Convertir timestamps de string a Date
          const messages = data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          
          setConversation({
            ...data,
            messages
          });
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setLoading(false);
      }
    }

    loadConversation();
  }, [userId, modelId]);

  // Guardar conversación
  const saveConversation = async (messages: Message[], preferences: any) => {
    if (!userId) return;

    setSaving(true);
    try {
      const conversationData = {
        user_id: userId,
        model_id: modelId,
        model_name: modelName,
        messages: messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        preferences,
        updated_at: new Date().toISOString()
      };

      if (conversation) {
        // Actualizar conversación existente
        const { error } = await supabase
          .from('conversations')
          .update(conversationData)
          .eq('id', conversation.id);

        if (error) throw error;
      } else {
        // Crear nueva conversación
        const { data, error } = await supabase
          .from('conversations')
          .insert(conversationData)
          .select()
          .single();

        if (error) throw error;
        setConversation(data);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    } finally {
      setSaving(false);
    }
  };

  // Agregar mensaje y guardar (limitado a 20 mensajes)
  const addMessage = async (message: Message, preferences: any) => {
    const currentMessages = conversation?.messages || [];
    const newMessages = [...currentMessages, message];
    
    // Limitar a los últimos 20 mensajes
    const limitedMessages = newMessages.slice(-20);
    
    await saveConversation(limitedMessages, preferences);
    
    setConversation(prev => prev ? {
      ...prev,
      messages: limitedMessages
    } : null);
  };

  // Obtener mensajes
  const getMessages = (): Message[] => {
    return conversation?.messages || [];
  };

  // Limpiar conversación
  const clearConversation = async () => {
    if (conversation) {
      try {
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversation.id);
        
        setConversation(null);
      } catch (error) {
        console.error('Error clearing conversation:', error);
      }
    }
  };

  return {
    conversation,
    loading,
    saving,
    addMessage,
    getMessages,
    clearConversation,
    saveConversation
  };
}
