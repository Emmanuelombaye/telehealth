import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
// @ts-ignore
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.production.example → .env.local and set your project credentials.',
  );
}

/**
 * Auth tokens use sessionStorage (per browser tab), not localStorage.
 * That lets you keep e.g. Admin in one tab and Doctor/Super Admin in another
 * without one login overwriting the other.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'peak-health-auth',
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    },
  },
);
