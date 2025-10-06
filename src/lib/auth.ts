import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Asegura que exista una fila en la tabla de negocio `users` para el email autenticado.
 * - Crea el registro si no existe.
 * - No eleva privilegios; depende de RLS que permita upsert del propio usuario autenticado.
 */
export async function ensureUserRow(supabase: SupabaseClient, email: string) {
  if (!email) return;
  try {
    // Obtener usuario autenticado para conocer su UID
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    const userEmail = userData?.user?.email || email;
    if (!uid) {
      console.warn('ensureUserRow: no auth.uid() available, aborting');
      return;
    }

    // Buscar por id (RLS de users usa id = auth.uid())
    const { data: existing, error: searchErr } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', uid)
      .maybeSingle();

    if (searchErr && searchErr.code !== 'PGRST116') {
      console.warn('ensureUserRow search warning:', searchErr.message);
    }

    if (!existing) {
      // Crear fila con id = auth.uid() para cumplir RLS
      const { error: insertErr } = await supabase
        .from('users')
        .insert({ id: uid, email: userEmail, is_premium: false })
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
