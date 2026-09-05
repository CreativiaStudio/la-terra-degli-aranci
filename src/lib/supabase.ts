import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-tda.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

// Client per operazioni pubbliche e RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client con permessi di amministratore per bypassare la RLS quando necessario (solo server-side)
export const getServiceSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-tda.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-service-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
};

