import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 Setting up auth state listener...');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('📋 Initial session check:', session?.user?.email || 'No session');
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('❌ Exception getting initial session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
        
        // Handle password recovery specifically
        if (event === 'PASSWORD_RECOVERY') {
          console.log('🔑 Password recovery event detected - redirecting to reset form');
          // Don't set the session immediately, let the reset form handle it
          setLoading(false);
          return;
        }
        
        // Clear any corrupted session data on sign out
        if (event === 'SIGNED_OUT') {
          console.log('🧹 Clearing session data...');
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('📝 Attempting sign up for:', email);
    
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
      console.error('❌ Sign up error:', error);
    } else {
      console.log('✅ Sign up successful for:', email);
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    
    // Special handling for problematic user
    if (email === 'jvcas@mac.com') {
      console.log('🧹 Special handling for jvcas@mac.com - clearing corrupted session first');
      await clearCorruptedSession();
      // Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('❌ Sign in error for', email, ':', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
    } else {
      console.log('✅ Sign in successful for:', email);
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    await supabase.auth.signOut();
    // Clear all session data
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
  };

  const resetPassword = async (email: string) => {
    console.log('🔑 Sending password reset for:', email);
    
    // Use recovery flow with proper redirect
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    console.log('📧 Using redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    if (error) {
      console.error('❌ Password reset error:', error);
    } else {
      console.log('✅ Password reset email sent to:', email);
    }
    
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    console.log('🔑 Updating password for current user');
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('❌ Password update error:', error);
    } else {
      console.log('✅ Password updated successfully');
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
