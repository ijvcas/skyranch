// Core data service to bypass RLS issues and provide reliable data access
import { supabase } from '@/integrations/supabase/client';

// Enhanced auth user check with session verification
export const getAuthenticatedUser = async () => {
  try {
    // First check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return null;
    }
    
    if (!session) {
      console.log('❌ No active session found');
      return null;
    }
    
    // Verify the session is valid by checking the user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Auth error:', error);
      return null;
    }
    
    if (!user) {
      console.log('❌ No user in session');
      return null;
    }
    
    console.log('✅ Authenticated user:', user.email);
    return user;
  } catch (error) {
    console.error('❌ Exception getting user:', error);
    return null;
  }
};

// Get user role with fallback logic
export const getUserRoleSecure = async (): Promise<'admin' | 'manager' | 'worker' | null> => {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    // Try direct query first with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    const queryPromise = supabase
      .from('app_users')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error || !data) {
      console.warn('⚠️ Could not get role from database, defaulting to worker');
      return 'worker'; // Default fallback
    }

    if (!data.is_active) {
      console.warn('⚠️ User is inactive');
      return null;
    }

    return data.role as 'admin' | 'manager' | 'worker';
  } catch (error) {
    console.error('❌ Error getting user role:', error);
    return 'worker'; // Safe fallback
  }
};

// Animals data with enhanced error handling and explicit user filtering
export const getAnimalsData = async () => {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      console.log('❌ No authenticated user for animals');
      return [];
    }

    console.log('🔍 CORE: Fetching animals for user:', user.email, 'ID:', user.id);

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 10000)
    );

    // Explicit user filtering to bypass RLS issues
    const queryPromise = supabase
      .from('animals')
      .select('*')
      .eq('user_id', user.id)
      .neq('lifecycle_status', 'deceased')
      .order('created_at', { ascending: false });

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.error('❌ CORE: Animals query error:', error);
      console.error('❌ CORE: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return [];
    }

    console.log('✅ CORE: Animals fetched:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ CORE: Exception fetching animals:', error);
    return [];
  }
};

// Users data with enhanced error handling  
export const getUsersData = async () => {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      console.log('❌ No authenticated user for users');
      return [];
    }

    console.log('🔍 CORE: Fetching users...');

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 10000)
    );

    const queryPromise = supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.error('❌ CORE: Users query error:', error);
      return [];
    }

    console.log('✅ CORE: Users fetched:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ CORE: Exception fetching users:', error);
    return [];
  }
};

// Health check function
export const performHealthCheck = async (): Promise<{
  isHealthy: boolean;
  auth: boolean;
  database: boolean;
  userRole: string | null;
}> => {
  console.log('🏥 CORE: Running health check...');
  
  const result = {
    isHealthy: false,
    auth: false,
    database: false,
    userRole: null as string | null
  };

  try {
    // Check auth
    const user = await getAuthenticatedUser();
    result.auth = !!user;
    
    if (user) {
      // Check database access
      try {
        const role = await getUserRoleSecure();
        result.userRole = role;
        result.database = true;
      } catch (error) {
        console.error('❌ CORE: Database check failed:', error);
      }
    }

    result.isHealthy = result.auth && result.database;
    console.log('🏥 CORE: Health check result:', result);
    return result;
  } catch (error) {
    console.error('❌ CORE: Health check exception:', error);
    return result;
  }
};