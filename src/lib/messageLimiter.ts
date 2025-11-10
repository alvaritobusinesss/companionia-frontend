import { supabase } from './supabase';

export async function checkMessageLimit(userId: string): Promise<{
  canSend: boolean;
  currentCount: number;
  limit: number;
}> {
  if (!userId) {
    return { canSend: false, currentCount: 0, limit: 0 };
  }

  const today = new Date().toISOString().split('T')[0];
  const DAILY_LIMIT = 5; // Límite diario de mensajes

  // Obtener el contador actual del día
  const { data, error } = await supabase
    .from('daily_messages')
    .select('message_count')
    .eq('user_id', userId)
    .eq('message_date', today)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 es "No se encontró ningún resultado"
    console.error('Error al verificar límite de mensajes:', error);
    return { canSend: false, currentCount: 0, limit: DAILY_LIMIT };
  }

  const currentCount = data?.message_count || 0;
  
  return {
    canSend: currentCount < DAILY_LIMIT,
    currentCount,
    limit: DAILY_LIMIT
  };
}

export async function incrementMessageCount(userId: string): Promise<void> {
  if (!userId) return;

  const today = new Date().toISOString().split('T')[0];
  
  // Usar upsert para insertar o actualizar el contador
  const { error } = await supabase.rpc('increment_message_count', {
    user_id: userId,
    message_date: today
  });

  if (error) {
    console.error('Error al incrementar contador de mensajes:', error);
  }
}

// Función para obtener el contador de mensajes (para mostrar en la UI)
export async function getMessageCount(userId: string): Promise<number> {
  if (!userId) return 0;

  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('daily_messages')
    .select('message_count')
    .eq('user_id', userId)
    .eq('message_date', today)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // Ignorar "No se encontró ningún resultado"
      console.error('Error al obtener contador de mensajes:', error);
    }
    return 0;
  }

  return data?.message_count || 0;
}
