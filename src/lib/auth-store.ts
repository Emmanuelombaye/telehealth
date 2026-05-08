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

/**
 * Get role — reads from JWT user_metadata FIRST (instant, no DB query, no 500s).
 * Falls back to profiles table only if metadata has no role.
 * This is the correct production approach.
 */
function getRoleFromSession(session: Session): { role: Role; brandId: string | null } {
  const meta = session.user.user_metadata || {};
  const appMeta = (session.user as any).app_metadata || {};

  // Priority: app_metadata (set server-side) > user_metadata (set at signup)
  const role = (appMeta.role || meta.role || 'patient') as Role;
  const brandId = appMeta.brand_id || meta.brand_id || null;

  return { role, brandId };
}

/**
 * Background sync: try to read/create the profile row.
 * We do this silently — it NEVER blocks or throws.
 */
async function syncProfile(session: Session): Promise<{ role: Role; brandId: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, brand_id')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!error && data) {
      // Profile table has an override (e.g. promoted to doctor)
      return { role: (data.role as Role) || 'patient', brandId: data.brand_id || null };
    }

    if (error) {
      // Log but don't throw — JWT role is already being used
      console.warn('[auth-store] profiles sync skipped:', error.message, '(status:', (error as any).status, ')');
    }
  } catch (err) {
    console.warn('[auth-store] syncProfile error (non-fatal):', err);
  }

  // Fall back to what JWT says
  return getRoleFromSession(session);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  role: null,
  brandId: null,
  isLoading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // 1. Set role immediately from JWT — no DB, no latency, no 500s
        const { role, brandId } = getRoleFromSession(session);
        set({ session, user: session.user, role, brandId, isLoading: false });

        // 2. Background: try profiles table for any server-side role overrides
        syncProfile(session).then(({ role: dbRole, brandId: dbBrandId }) => {
          // Only update if profile table returned a different (promoted) role
          if (dbRole && dbRole !== get().role) {
            set({ role: dbRole, brandId: dbBrandId });
          }
        });
      } else {
        set({ session: null, user: null, role: null, brandId: null, isLoading: false });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user) {
          const { role, brandId } = getRoleFromSession(newSession);
          set({ session: newSession, user: newSession.user, role, brandId, isLoading: false });

          // Background profile sync for role promotions
          syncProfile(newSession).then(({ role: dbRole, brandId: dbBrandId }) => {
            if (dbRole && dbRole !== get().role) {
              set({ role: dbRole, brandId: dbBrandId });
            }
          });
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
    localStorage.removeItem('peak_health_dev_role');
    await supabase.auth.signOut();
    set({ session: null, user: null, role: null, brandId: null });
  },

  setSession: (session) => set({ session, user: session?.user || null }),
}));
