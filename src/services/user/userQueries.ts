
import { supabase } from '@/integrations/supabase/client';
import { type AppUser } from './types';

// Get all users from the app_users table AND sync auth users
export const getAllUsers = async (): Promise<AppUser[]> => {
  try {
    console.log('🔍 Fetching all users from app_users table...');
    
    // First, sync any missing auth users (with error handling)
    try {
      await syncAuthUsersToAppUsers();
    } catch (syncError) {
      console.warn('⚠️ Sync warning (continuing anyway):', syncError);
      // Continue even if sync fails - we can still show existing users
    }

    const { data: users, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }

    console.log('✅ Successfully fetched users:', users?.length || 0);
    
    // Map the data with proper typing
    return users?.map(user => ({
      ...user,
      role: user.role as 'admin' | 'manager' | 'worker',
      phone: user.phone || '', // Now properly handled from database
    })) || [];
  } catch (error) {
    console.error('❌ Error in getAllUsers:', error);
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

// Get current authenticated user info with enhanced sync retry
export const getCurrentUser = async (): Promise<AppUser | null> => {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return null;
    }

    if (!authUser) {
      console.log('❌ No authenticated user found');
      return null;
    }

    console.log('🔍 Looking for user in app_users with ID:', authUser.id);

    // First, try to find the user in app_users
    let { data: appUser, error: dbError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // If not found by ID, try by email as fallback
    if (dbError && authUser.email) {
      console.log('⚠️ User not found by ID, trying by email:', authUser.email);
      const { data: userByEmail, error: emailError } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', authUser.email)
        .single();
        
      if (!emailError && userByEmail) {
        appUser = userByEmail;
        dbError = null;
        console.log('✅ Found user by email, will sync ID');
        
        // Update the user record with correct auth ID
        await supabase
          .from('app_users')
          .update({ id: authUser.id })
          .eq('email', authUser.email);
      }
    }

    // If still not found, try to sync and create the user
    if (dbError || !appUser) {
      console.log('⚠️ User not found in app_users, attempting sync...');
      try {
        await syncAuthUsersToAppUsers();
        
        // Try again after sync
        const { data: syncedUser, error: syncError } = await supabase
          .from('app_users')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (!syncError && syncedUser) {
          appUser = syncedUser;
          dbError = null;
          console.log('✅ User found after sync');
        }
      } catch (syncError) {
        console.error('❌ Sync failed:', syncError);
      }
    }

    if (dbError || !appUser) {
      console.error('❌ Database error or user not found:', dbError);
      return null;
    }

    return {
      ...appUser,
      role: appUser.role as 'admin' | 'manager' | 'worker',
      phone: appUser.phone || '',
    };
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
};
