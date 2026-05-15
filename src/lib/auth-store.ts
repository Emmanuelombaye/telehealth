import { create } from 'zustand';
import { supabase } from './supabaseClient';
import { User, Session } from '@supabase/supabase-js';

export type Role =
  | 'patient'
  | 'doctor'
  | 'pharmacy'
  | 'brand_admin'
  | 'super_admin'
  | 'affiliate'
  | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  role: Role;
  brandId: string | null;
  isLoading: boolean;
  initialize: (initialSession?: Session | null) => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

/**
 * Get role — prefers JWT `app_metadata` (server-set), then `user_metadata`,
 * then profiles sync. Brand id uses the same precedence.
 */
function getRoleFromSession(session: Session): { role: Role; brandId: string | null } {
  // Priority 1: Dev override (Always highest priority for staff/testing bypass)
  const devRole = typeof window !== 'undefined' ? localStorage.getItem('peak_health_dev_role') : null;
  
  const meta = session.user.user_metadata || {};
  const appMeta = (session.user as any).app_metadata || {};

  const brandId = appMeta.brand_id || meta.brand_id || null;

  if (devRole) {
    return { role: devRole as Role, brandId };
  }

  // Priority 2: app_metadata (set server-side via admin API)
  // Priority 3: user_metadata (set at signup)
  const sessionRole = (appMeta.role || meta.role) as Role;

  if (sessionRole) {
    return { role: sessionRole, brandId };
  }

  // Default
  return { role: 'patient', brandId };
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

  initialize: async (initialSession) => {
    try {
      const session = initialSession !== undefined ? initialSession : (await supabase.auth.getSession()).data.session;

      if (session?.user) {
        const jwtRB = getRoleFromSession(session);
        set({ session, user: session.user, role: jwtRB.role, brandId: jwtRB.brandId, isLoading: false });
        void syncProfile(session).then((merged) => {
          if (merged.role !== jwtRB.role || merged.brandId !== jwtRB.brandId) {
            set({ role: merged.role, brandId: merged.brandId });
          }
        });
      } else {
        // No real session — check for dev role override (staff/testing bypass)
        const devRole = typeof window !== 'undefined' ? localStorage.getItem('peak_health_dev_role') : null;
        if (devRole) {
          const fakeUser = {
            id: '00000000-0000-0000-0000-000000000000',
            email: `${devRole.replace('_', '')}@peakbodyco.com`,
            user_metadata: { first_name: devRole.split('_').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') }
          } as unknown as User;
          set({ session: null, user: fakeUser, role: devRole as Role, brandId: null, isLoading: false });
        } else {
          set({ session: null, user: null, role: null, brandId: null, isLoading: false });
        }
      }

      supabase.auth.onAuthStateChange((_event, newSession) => {
        if (newSession?.user) {
          const jwtRB = getRoleFromSession(newSession);
          set({ session: newSession, user: newSession.user, role: jwtRB.role, brandId: jwtRB.brandId, isLoading: false });
          void syncProfile(newSession).then((merged) => {
            if (merged.role !== jwtRB.role || merged.brandId !== jwtRB.brandId) {
              set({ role: merged.role, brandId: merged.brandId });
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
