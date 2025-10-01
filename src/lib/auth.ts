import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Asegura que exista una fila en la tabla de negocio `users` para el email autenticado.
 * - Crea el registro si no existe.
 * - No eleva privilegios; depende de RLS que permita upsert del propio usuario autenticado.
 */
export async function ensureUserRow(supabase: SupabaseClient, email: string) {
  if (!email) return;
  try {
    // Buscar por email
    const { data: existing, error: searchErr } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (searchErr) {
      // Si el error es que no existe, seguiremos intentando crear
      console.warn('ensureUserRow search warning:', searchErr.message);
    }

    if (!existing) {
      // Crear fila mínima
      const { error: insertErr } = await supabase
        .from('users')
        .insert({ email, is_premium: false })
        .select('id')
        .single();
      if (insertErr) {
        console.warn('ensureUserRow insert warning:', insertErr.message);
      }
    }
  } catch (e: any) {
    console.warn('ensureUserRow exception:', e?.message || e);
  }
}
