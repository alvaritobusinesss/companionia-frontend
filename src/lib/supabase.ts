import { createClient } from '@supabase/supabase-js';

// Debug opcional solo en desarrollo
if (import.meta.env.DEV) {
  console.log('🔍 DEBUG Supabase Config:', {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING',
  });
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);