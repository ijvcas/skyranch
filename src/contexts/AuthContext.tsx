import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { validatePasswordStrength } from '@/utils/passwordPolicy';
import { logConnection, logTokenRefreshedThrottled } from '@/utils/connectionLogger';
import { UserRole, Permission, getCurrentUserRole } from '@/services/permissionService';
import { ROLE_PERMISSIONS } from '@/services/permissionService';
import { permissionCache } from '@/services/permissionCache';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole | null;
  permissions: Permission[];
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithBiometric: () => Promise<{ error: any; showSetup?: boolean }>;
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
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [AUTH CONTEXT] Initializing auth...');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 [AUTH CONTEXT] Auth state changed:', event);
        }

        if (event === 'PASSWORD_RECOVERY') {
          setLoading(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          // Throttled to avoid noise
          logTokenRefreshedThrottled().catch((e) => {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[AUTH CONTEXT] token refresh log failed', e);
            }
          });
          // Clear cache on token refresh to pick up any role changes
          permissionCache.clearAuthCache();
        }

        if (event === 'SIGNED_OUT') {
          try {
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.clear();
          } catch (e) {
            console.warn('⚠️ [AUTH CONTEXT] Storage clear failed', e);
          }
          permissionCache.clear();
          setUserRole(null);
          setPermissions([]);
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Load role and permissions once on sign in
        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          // Clear cache on sign in to ensure fresh permissions
          permissionCache.clearAuthCache();
          setTimeout(async () => {
            try {
              const role = await getCurrentUserRole(session.user);
              setUserRole(role);
              const perms = role ? ROLE_PERMISSIONS[role] : [];
              setPermissions(perms);
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error('❌ [AUTH CONTEXT] Failed to load role:', error);
              }
            }
          }, 0);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (error && process.env.NODE_ENV === 'development') {
          console.error('❌ [AUTH CONTEXT] Error getting initial session:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        
        // Load role and permissions for existing session
        if (session?.user) {
          try {
            const role = await getCurrentUserRole(session.user);
            setUserRole(role);
            const perms = role ? ROLE_PERMISSIONS[role] : [];
            setPermissions(perms);
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ [AUTH CONTEXT] Failed to load initial role:', error);
            }
          }
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ [AUTH CONTEXT] Exception getting initial session:', error);
        }
      })
      .finally(() => setLoading(false));

    return () => {
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
    
    if (error && process.env.NODE_ENV === 'development') {
      console.error('❌ [AUTH CONTEXT] Sign up error:', error);
    } else if (!error) {
      // Fire sync in background - don't block signup
      Promise.resolve(supabase.rpc('sync_auth_users_to_app_users'))
        .then(({ error: syncError }) => {
          if (syncError && process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [AUTH CONTEXT] Post-signup sync failed:', syncError);
          }
        })
        .catch((e) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [AUTH CONTEXT] Post-signup sync exception:', e);
          }
        });
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error && process.env.NODE_ENV === 'development') {
      console.error('❌ [AUTH CONTEXT] Sign in error:', error.message);
    } else if (!error) {
      // Lightweight connection log
      await logConnection('signed_in', { method: 'password' });
      
      // Fire sync in background - don't block login
      Promise.resolve(supabase.rpc('sync_auth_users_to_app_users'))
        .then(({ error: syncError }) => {
          if (syncError && process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [AUTH CONTEXT] Post-signin sync failed:', syncError);
          }
        })
        .catch((e) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [AUTH CONTEXT] Post-signin sync exception:', e);
          }
        });
    }
    
    return { error };
  };

  const signInWithBiometric = async () => {
    try {
      const { BiometricService } = await import('@/services/biometricService');
      
      // Check if biometric is available and enabled
      const isEnabled = await BiometricService.isEnabled();
      if (!isEnabled) {
        return { error: { message: 'Biometric not enabled' }, showSetup: true };
      }

      // Authenticate with biometric
      const authenticated = await BiometricService.authenticate();
      if (!authenticated) {
        return { error: { message: 'Biometric authentication cancelled or failed' } };
      }

      // Get stored credentials
      const credentials = await BiometricService.getCredentials();
      if (!credentials) {
        return { error: { message: 'No credentials found' }, showSetup: true };
      }

      // Sign in with stored credentials
      return await signIn(credentials.email, credentials.password);
    } catch (error) {
      console.error('❌ Biometric sign in error:', error);
      return { error: { message: 'Biometric authentication failed' } };
    }
  };

  const signOut = async (clearBiometric = false) => {
    // Only clear biometric credentials if explicitly requested
    if (clearBiometric) {
      try {
        const { BiometricService } = await import('@/services/biometricService');
        await BiometricService.deleteCredentials();
      } catch (e) {
        console.warn('⚠️ Failed to clear biometric credentials:', e);
      }
    }

    // Clear permission cache on sign out
    const { permissionCache } = await import('@/services/permissionCache');
    permissionCache.clearAuthCache();
    
    // Clear role and permissions
    setUserRole(null);
    setPermissions([]);
    
    // Log before signing out so RLS still allows insert
    await logConnection('signed_out');
    await supabase.auth.signOut();
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
  };

  const resetPassword = async (email: string) => {
    // Use dynamic redirect URL based on environment
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    if (error && process.env.NODE_ENV === 'development') {
      console.error('❌ [AUTH CONTEXT] Password reset error:', error.message);
    }
    
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    // Enhanced session verification
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return { error: sessionError };
    }
    
    if (!session) {
      return { error: { message: 'No active session found' } };
    }
    
    // Enforce strong password policy (client-side guard)
    const check = validatePasswordStrength(newPassword, session.user.email || undefined);
    if (!check.valid) {
      return { error: { message: check.errors[0] } } as any;
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error && process.env.NODE_ENV === 'development') {
      console.error('❌ [AUTH CONTEXT] Password update error:', error.message);
    }
    
    return { error };
  };

  const forcePasswordUpdate = async (email: string, newPassword: string) => {
    try {
      // Use secure edge function for admin operations
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'force_password_update',
          email, 
          newPassword 
        }
      });
      
      if (error) {
        return { error: { message: error.message || 'Error al actualizar contraseña' } };
      }
      
      if (!data?.success) {
        return { error: { message: data?.error || 'Error al actualizar contraseña' } };
      }
      
      return { error: null };
      
    } catch (error) {
      return { error: { message: 'Error al actualizar contraseña directamente' } };
    }
  };

  const clearCorruptedSession = async () => {
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
        }
      });
      
      // Reset auth state
      setSession(null);
      setUser(null);
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error clearing session:', error);
      }
    }
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    permissions,
    signUp,
    signIn,
    signInWithBiometric,
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
