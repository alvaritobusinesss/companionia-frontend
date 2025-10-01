import { SupabaseClient } from '@supabase/supabase-js';

export async function getUserMemory(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_memory')
    .select('snippet')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) return [];
  return (data || []).map((r: any) => r.snippet);
}

export async function upsertUserMemory(supabase: SupabaseClient, userId: string, snippet: string) {
  await supabase
    .from('user_memory')
    .insert({ user_id: userId, snippet });
}

// Borra todas las entradas de memoria para un usuario concreto
export async function deleteUserMemory(supabase: SupabaseClient, userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_memory')
      .delete()
      .eq('user_id', userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'unknown error' };
  }
}









