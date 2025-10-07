import { createClient } from '@supabase/supabase-js';

// Minimal client used by frontend
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);