import { createClient } from '@supabase/supabase-js';

// Validar que las variables de entorno estén disponibles
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL no está definida');
  throw new Error('VITE_SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY no está definida');
  throw new Error('VITE_SUPABASE_ANON_KEY is required');
}

console.log('✅ Supabase configurado correctamente:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey
});

// Configuración del cliente con opciones adicionales para producción
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'companion-ai-web'
    }
  }
});