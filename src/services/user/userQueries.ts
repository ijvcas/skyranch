
import { supabase } from '@/integrations/supabase/client';
import { type AppUser } from './types';

// Get all users from the app_users table with enhanced error handling
export const getAllUsers = async (): Promise<AppUser[]> => {
  try {
    console.log('🔍 USERS: Fetching all users from app_users table...');
    
    // Check auth first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ USERS: No authenticated user');
      return [];
    }

    console.log('👤 USERS: Authenticated as:', user.email);

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
    );

    const queryPromise = supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('🔄 USERS: Executing query with timeout...');
    const { data: users, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.error('❌ USERS: Query error:', error);
      console.error('❌ USERS: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return [];
    }

    console.log('✅ USERS: Successfully fetched users:', users?.length || 0);
    
    // Map the data with proper typing and validation
    const mappedUsers = (users || []).map(user => {
      if (!user.id || !user.email) {
        console.warn('⚠️ USERS: Invalid user data:', user);
        return null;
      }
      return {
        ...user,
        role: user.role as 'admin' | 'manager' | 'worker',
        phone: user.phone || '',
      };
    }).filter(Boolean);

    console.log('✅ USERS: Mapped users count:', mappedUsers.length);
    return mappedUsers as AppUser[];
  } catch (error) {
    console.error('❌ USERS: Exception in getAllUsers:', error);
    if (error instanceof Error) {
      console.error('❌ USERS: Error name:', error.name);
      console.error('❌ USERS: Error message:', error.message);
      console.error('❌ USERS: Error stack:', error.stack);
    }
    return [];
  }
};

// Sync all auth users to app_users table via secure RPC (server-side rules)
export const syncAuthUsersToAppUsers = async (): Promise<void> => {
  try {
    console.log('🔄 Syncing auth users to app_users via RPC...');

    // Use the database function which handles confirmed emails and conflicts safely
    const { error } = await supabase.rpc('sync_auth_users_to_app_users');

    if (error) {
      console.error('❌ RPC sync error:', error);
      throw error;
    }

    console.log('✅ Successfully synced auth users to app_users via RPC');
  } catch (error) {
    console.error('❌ Error in syncAuthUsersToAppUsers:', error);
    throw error;
  }
};

// Get current authenticated user info with enhanced error handling
export const getCurrentUser = async (): Promise<AppUser | null> => {
  try {
    console.log('🔍 CURRENT_USER: Getting current user...');
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ CURRENT_USER: Auth error:', authError);
      return null;
    }

    if (!authUser) {
      console.log('❌ CURRENT_USER: No authenticated user found');
      return null;
    }

    console.log('👤 CURRENT_USER: Auth user found:', authUser.email);

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 8000)
    );

    const queryPromise = supabase
      .from('app_users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    console.log('🔄 CURRENT_USER: Querying app_users with timeout...');
    const { data: appUser, error: dbError } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (dbError) {
      console.error('❌ CURRENT_USER: Database error:', dbError);
      
      // If database fails, create a minimal user object from auth data
      console.log('⚠️ CURRENT_USER: Creating fallback user from auth data');
      return {
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: 'worker', // Safe default
        phone: '',
        is_active: true,
        created_at: authUser.created_at || new Date().toISOString(),
        created_by: authUser.id
      };
    }

    if (!appUser) {
      console.log('⚠️ CURRENT_USER: User not found in app_users, attempting sync...');
      try {
        await syncAuthUsersToAppUsers();
        
        // Try once more after sync
        const { data: syncedUser } = await supabase
          .from('app_users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
          
        if (syncedUser) {
          console.log('✅ CURRENT_USER: User found after sync');
          return {
            ...syncedUser,
            role: syncedUser.role as 'admin' | 'manager' | 'worker',
            phone: syncedUser.phone || '',
          };
        }
      } catch (syncError) {
        console.error('❌ CURRENT_USER: Sync failed:', syncError);
      }
      
      // Still no user, return fallback
      console.log('⚠️ CURRENT_USER: Creating fallback user after failed sync');
      return {
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: 'worker',
        phone: '',
        is_active: true,
        created_at: authUser.created_at || new Date().toISOString(),
        created_by: authUser.id
      };
    }

    console.log('✅ CURRENT_USER: User found successfully:', appUser.name);
    return {
      ...appUser,
      role: appUser.role as 'admin' | 'manager' | 'worker',
      phone: appUser.phone || '',
    };
  } catch (error) {
    console.error('❌ CURRENT_USER: Exception getting current user:', error);
    
    // Final fallback - try to get auth user for minimal data
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        console.log('⚠️ CURRENT_USER: Returning minimal fallback user');
        return {
          id: authUser.id,
          name: authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          role: 'worker',
          phone: '',
          is_active: true,
          created_at: authUser.created_at || new Date().toISOString(),
          created_by: authUser.id
        };
      }
    } catch (fallbackError) {
      console.error('❌ CURRENT_USER: Even fallback failed:', fallbackError);
    }
    
    return null;
  }
};
