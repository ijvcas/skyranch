import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { validatePasswordStrength } from '@/utils/passwordPolicy';
import { logConnection, logTokenRefreshedThrottled } from '@/utils/connectionLogger';
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  forcePasswordUpdate: (email: string, newPassword: string) => Promise<{ error: any }>;
  clearCorruptedSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 [AUTH CONTEXT] Initializing auth...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 [AUTH CONTEXT] Auth state changed:', event, session?.user?.email || 'No user');

        if (event === 'PASSWORD_RECOVERY') {
          setLoading(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          // Throttled to avoid noise
          logTokenRefreshedThrottled().catch((e) => console.warn('[AUTH CONTEXT] token refresh log failed', e));
        }

        if (event === 'SIGNED_OUT') {
          try {
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.clear();
          } catch (e) {
            console.warn('⚠️ [AUTH CONTEXT] Storage clear failed', e);
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        console.log('📋 [AUTH CONTEXT] Initial session check:', session?.user?.email || 'No session');
        if (error) {
          console.error('❌ [AUTH CONTEXT] Error getting initial session:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((error) => {
        console.error('❌ [AUTH CONTEXT] Exception getting initial session:', error);
      })
      .finally(() => setLoading(false));

    return () => {
      console.log('🧹 [AUTH CONTEXT] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || email
        }
      }
    });
    
    if (error) {
      console.error('❌ [AUTH CONTEXT] Sign up error:', error);
    } else {
      console.log('✅ [AUTH CONTEXT] Sign up successful for:', email);
      try {
        const { error: syncError } = await supabase.rpc('sync_auth_users_to_app_users');
        if (syncError) {
          console.warn('⚠️ [AUTH CONTEXT] Post-signup sync failed:', syncError);
        } else {
          console.log('🔄 [AUTH CONTEXT] Post-signup sync completed');
        }
      } catch (e) {
        console.warn('⚠️ [AUTH CONTEXT] Post-signup sync exception:', e);
      }
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 [AUTH CONTEXT] Attempting sign in for:', email);

    if (email === 'jvcas@mac.com') {
      console.log('🧹 [AUTH CONTEXT] Special handling for jvcas@mac.com - clearing corrupted session first');
      await clearCorruptedSession();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('❌ [AUTH CONTEXT] Sign in error for', email, ':', error);
      console.error('❌ [AUTH CONTEXT] Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      // Note: cannot log failed sign-ins via table due to RLS (no user session yet).
    } else {
      console.log('✅ [AUTH CONTEXT] Sign in successful for:', email);
      // Lightweight connection log
      await logConnection('signed_in', { method: 'password' });
      try {
        const { error: syncError } = await supabase.rpc('sync_auth_users_to_app_users');
        if (syncError) {
          console.warn('⚠️ [AUTH CONTEXT] Post-signin sync failed:', syncError);
        } else {
          console.log('🔄 [AUTH CONTEXT] Post-signin sync completed');
        }
      } catch (e) {
        console.warn('⚠️ [AUTH CONTEXT] Post-signin sync exception:', e);
      }
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('🚪 [AUTH CONTEXT] Signing out...');
    // Log before signing out so RLS still allows insert
    await logConnection('signed_out');
    await supabase.auth.signOut();
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
  };

  const resetPassword = async (email: string) => {
    console.log('🔑 [AUTH CONTEXT] Sending password reset for:', email);
    
    // Use the production URL for reset with enhanced logging
    const redirectUrl = `https://skyranch.lovable.app/reset-password`;
    
    console.log('📧 [AUTH CONTEXT] Using redirect URL:', redirectUrl);
    console.log('📧 [AUTH CONTEXT] Current window origin:', window.location.origin);
    console.log('📧 [AUTH CONTEXT] Current window URL:', window.location.href);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    if (error) {
      console.error('❌ [AUTH CONTEXT] Password reset error:', error);
      console.error('❌ [AUTH CONTEXT] Reset error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
        code: error.code
      });
    } else {
      console.log('✅ [AUTH CONTEXT] Password reset email sent to:', email);
      console.log('✅ [AUTH CONTEXT] Reset email should contain link to:', redirectUrl);
    }
    
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    console.log('🔑 [AUTH CONTEXT] Updating password for current user');
    
    // Enhanced session verification
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ [AUTH CONTEXT] Session verification error:', sessionError);
      return { error: sessionError };
    }
    
    if (!session) {
      console.error('❌ [AUTH CONTEXT] No active session for password update');
      return { error: { message: 'No active session found' } };
    }
    
    console.log('✅ [AUTH CONTEXT] Session verified for password update:', session.user.email);
    
    // Enforce strong password policy (client-side guard)
    const check = validatePasswordStrength(newPassword, session.user.email || undefined);
    if (!check.valid) {
      console.error('❌ [AUTH CONTEXT] Weak password per policy:', check.errors);
      return { error: { message: check.errors[0] } } as any;
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('❌ [AUTH CONTEXT] Password update error:', error);
      console.error('❌ [AUTH CONTEXT] Update error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
        code: error.code
      });
    } else {
      console.log('✅ [AUTH CONTEXT] Password updated successfully');
    }
    
    return { error };
  };

  const forcePasswordUpdate = async (email: string, newPassword: string) => {
    console.log('🔧 Force updating password for:', email);
    
    try {
      // First, clear any corrupted sessions
      await clearCorruptedSession();
      
      // Use listUsers to find the user by email
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error listing users:', listError);
        return { error: { message: 'Error al buscar usuarios' } };
      }
      
      const foundUser = users?.find((u: any) => u.email === email);
      
      if (!foundUser) {
        console.error('❌ User not found');
        return { error: { message: 'Usuario no encontrado' } };
      }
      
      // Use admin API to update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(foundUser.id, {
        password: newPassword
      });
      
      if (updateError) {
        console.error('❌ Admin password update failed:', updateError);
        return { error: updateError };
      }
      
      console.log('✅ Password force updated successfully');
      return { error: null };
      
    } catch (error) {
      console.error('❌ Force password update error:', error);
      return { error: { message: 'Error al actualizar contraseña directamente' } };
    }
  };

  const clearCorruptedSession = async () => {
    console.log('🧹 Clearing corrupted session data...');
    
    try {
      // Sign out completely
      await supabase.auth.signOut();
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear specific Supabase keys
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
          console.log('🗑️ Removed key:', key);
        }
      });
      
      // Reset auth state
      setSession(null);
      setUser(null);
      
      console.log('✅ Session cleared successfully');
      
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    forcePasswordUpdate,
    clearCorruptedSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
