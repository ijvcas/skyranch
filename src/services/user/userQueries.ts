
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

// Sync all auth users to app_users table with improved error handling
export const syncAuthUsersToAppUsers = async (): Promise<void> => {
  try {
    console.log('🔄 Syncing auth users to app_users...');
    
    // Get all auth users first
    const { data: authUsers, error: authError } = await supabase.rpc('get_auth_users');
    
    if (authError) {
      console.error('❌ Error getting auth users:', authError);
      throw authError;
    }

    console.log('📋 Found auth users to sync:', authUsers?.length || 0);

    // Get existing app users to avoid duplicates
    const { data: existingAppUsers, error: existingError } = await supabase
      .from('app_users')
      .select('id, email');

    if (existingError) {
      console.error('❌ Error getting existing app users:', existingError);
      throw existingError;
    }

    const existingEmails = new Set(existingAppUsers?.map(u => u.email) || []);
    const existingIds = new Set(existingAppUsers?.map(u => u.id) || []);

    // Filter out users that already exist by ID or email
    const usersToInsert = authUsers?.filter(authUser => 
      !existingIds.has(authUser.id) && 
      !existingEmails.has(authUser.email) &&
      authUser.email
    ) || [];

    console.log('➕ Users to insert:', usersToInsert.length);

    if (usersToInsert.length === 0) {
      console.log('✅ No new users to sync');
      return;
    }

    // Prepare users for insertion with proper type handling
    const usersForInsertion = usersToInsert.map(authUser => {
      const metadata = authUser.raw_user_meta_data as any;
      return {
        id: authUser.id,
        name: metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario',
        email: authUser.email,
        role: 'worker' as const,
        is_active: true,
        created_by: authUser.id,
        phone: metadata?.phone || ''
      };
    });

    // Insert new users
    const { error: insertError } = await supabase
      .from('app_users')
      .insert(usersForInsertion);

    if (insertError) {
      console.error('❌ Error inserting new users:', insertError);
      throw insertError;
    }
    
    console.log('✅ Successfully synced auth users to app_users');
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
