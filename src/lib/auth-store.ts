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
        // Fetch role and brand_id from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, brand_id')
          .eq('id', session.user.id)
          .single();
          
        set({ 
          session, 
          user: session.user, 
          role: (profile?.role as Role) || 'patient',
          brandId: profile?.brand_id || null,
          isLoading: false 
        });
      } else {
        set({ session: null, user: null, role: null, brandId: null, isLoading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, brand_id')
            .eq('id', newSession.user.id)
            .single();
            
          set({ 
            session: newSession, 
            user: newSession.user, 
            role: (profile?.role as Role) || 'patient',
            brandId: profile?.brand_id || null,
            isLoading: false 
          });
        } else {
          set({ session: null, user: null, role: null, brandId: null, isLoading: false });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, role: null, brandId: null });
  },

  setSession: (session) => set({ session, user: session?.user || null }),
}));
