import { create } from 'zustand';
import { supabase } from './supabaseClient';
import { User, Session } from '@supabase/supabase-js';

export type Role = 'patient' | 'doctor' | 'brand_admin' | 'super_admin' | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  role: Role;
  brandId: string | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

/** Fetch the role from profiles table, with graceful fallback.
 *  - If the profile row doesn't exist yet (new user, trigger not run), returns 'patient'
 *  - If there's a network/RLS error, returns 'patient' and logs a warning (never throws)
 */
async function fetchRole(userId: string): Promise<{ role: Role; brandId: string | null }> {
  try {
    const { data, error, status } = await supabase
      .from('profiles')
      .select('role, brand_id')
      .eq('id', userId)
      .maybeSingle(); // maybeSingle returns null instead of error when row missing

    if (error) {
      // 500 = RLS issue / table missing — degrade gracefully
      if (status === 500 || status === 404) {
        console.warn(`[auth-store] profiles fetch returned ${status} — defaulting to patient role`);
        // Attempt to create the missing profile row (include email to satisfy NOT NULL)
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        await supabase.from('profiles').upsert({
          id: userId,
          role: 'patient',
          email: currentUser?.email || null,
        }, { onConflict: 'id' });
        return { role: 'patient', brandId: null };
      }
      console.warn('[auth-store] profiles fetch error:', error.message);
      return { role: 'patient', brandId: null };
    }

    return {
      role: (data?.role as Role) || 'patient',
      brandId: data?.brand_id || null,
    };
  } catch (err) {
    console.warn('[auth-store] fetchRole threw:', err);
    return { role: 'patient', brandId: null };
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  brandId: null,
  isLoading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { role, brandId } = await fetchRole(session.user.id);
        set({ session, user: session.user, role, brandId, isLoading: false });
      } else {
        set({ session: null, user: null, role: null, brandId: null, isLoading: false });
      }

      // Listen for auth state changes (login/logout/token refresh)
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user) {
          const { role, brandId } = await fetchRole(newSession.user.id);
          set({ session: newSession, user: newSession.user, role, brandId, isLoading: false });
        } else {
          set({ session: null, user: null, role: null, brandId: null, isLoading: false });
        }
      });
    } catch (error) {
      console.error('[auth-store] initialize error:', error);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, role: null, brandId: null });
  },

  setSession: (session) => set({ session, user: session?.user || null }),
}));
