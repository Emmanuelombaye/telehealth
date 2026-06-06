import { create } from 'zustand';
import { supabase } from './supabaseClient';
import { User, Session } from '@supabase/supabase-js';
import { hasForcePatientPortalIntent } from './patientPortalIntent';

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

/** Clear legacy client-side demo auth keys from older builds. */
function clearLegacyDemoStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('peak_health_dev_role');
  localStorage.removeItem('peak_health_demo_email');
}

/**
 * Get role — prefers JWT `app_metadata` (server-set), then `user_metadata`,
 * then profiles sync. Brand id uses the same precedence.
 */
function getRoleFromSession(session: Session): { role: Role; brandId: string | null } {
  const meta = session.user.user_metadata || {};
  const appMeta = (session.user as { app_metadata?: { role?: string; brand_id?: string } }).app_metadata || {};
  const brandId = appMeta.brand_id || meta.brand_id || null;

  if (hasForcePatientPortalIntent()) {
    return { role: 'patient', brandId };
  }

  const sessionRole = (appMeta.role || meta.role) as Role;

  if (sessionRole) {
    return { role: sessionRole, brandId };
  }

  return { role: 'patient', brandId };
}

function sessionJwtRole(session: Session): Role | null {
  const meta = session.user.user_metadata || {};
  const appMeta = (session.user as { app_metadata?: { role?: string } }).app_metadata || {};
  return (appMeta.role || meta.role) as Role | null;
}

async function syncProfile(session: Session): Promise<{ role: Role; brandId: string | null }> {
  const jwtRB = getRoleFromSession(session);
  if (hasForcePatientPortalIntent()) {
    return { role: 'patient', brandId: jwtRB.brandId };
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, brand_id')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!error && data) {
      const profileRole = (data.role as Role) || 'patient';
      if (sessionJwtRole(session) === 'patient' && profileRole !== 'patient') {
        return { role: 'patient', brandId: data.brand_id || jwtRB.brandId };
      }
      return { role: profileRole, brandId: data.brand_id || null };
    }

    if (error) {
      console.warn('[auth-store] profiles sync skipped:', error.message, '(status:', (error as any).status, ')');
    }
  } catch (err) {
    console.warn('[auth-store] syncProfile error (non-fatal):', err);
  }

  return getRoleFromSession(session);
}

let authListenerBound = false;

function bindAuthListener(
  set: (partial: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>)) => void,
  get: () => AuthState,
) {
  if (authListenerBound) return;
  authListenerBound = true;

  supabase.auth.onAuthStateChange((event, newSession) => {
    if (event === "TOKEN_REFRESHED" && !newSession) {
      void get().signOut();
      return;
    }
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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  role: null,
  brandId: null,
  isLoading: true,

  initialize: async (initialSession) => {
    try {
      clearLegacyDemoStorage();

      let session: Session | null = initialSession !== undefined ? initialSession : null;
      if (initialSession === undefined) {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          const msg = error.message?.toLowerCase() ?? "";
          if (msg.includes("refresh token") || msg.includes("invalid")) {
            await supabase.auth.signOut();
            set({ session: null, user: null, role: null, brandId: null, isLoading: false });
            return;
          }
          console.warn("[auth-store] getSession:", error.message);
        }
        session = data.session;
      }

      if (session?.user) {
        const jwtRB = getRoleFromSession(session);
        set({ session, user: session.user, role: jwtRB.role, brandId: jwtRB.brandId, isLoading: false });
        void syncProfile(session).then((merged) => {
          if (merged.role !== jwtRB.role || merged.brandId !== jwtRB.brandId) {
            set({ role: merged.role, brandId: merged.brandId });
          }
        });
      } else {
        set({ session: null, user: null, role: null, brandId: null, isLoading: false });
      }

      bindAuthListener(set, get);
    } catch (error) {
      console.error('[auth-store] initialize error:', error);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    clearLegacyDemoStorage();
    await supabase.auth.signOut();
    set({ session: null, user: null, role: null, brandId: null });
  },

  setSession: (session) => set({ session, user: session?.user || null }),
}));
