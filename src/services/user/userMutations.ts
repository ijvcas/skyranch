
import { supabase } from '@/integrations/supabase/client';
import { type AppUser } from './types';
import { sanitizeUserInput, isValidEmail, isValidPhone, isValidName } from '@/utils/security';
import { permissionCache } from '@/services/permissionCache';
import { SubscriptionService } from '@/services/subscription';

// Add a new user to the app_users table
export const addUser = async (userData: Omit<AppUser, 'id' | 'created_at' | 'created_by'>): Promise<boolean> => {
  try {
    console.log('➕ Adding new user:', userData);

    // Check subscription limits before adding
    const limitCheck = await SubscriptionService.canAddUser();
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.message || 'No puedes agregar más usuarios en tu plan actual');
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      console.error('❌ No authenticated user to perform this operation');
      throw new Error('No authenticated user');
    }

    // Validate and sanitize input data
    const sanitizedName = sanitizeUserInput(userData.name);
    const sanitizedEmail = userData.email.toLowerCase().trim();
    const sanitizedPhone = userData.phone ? sanitizeUserInput(userData.phone) : '';

    // Security validations
    if (!isValidName(sanitizedName)) {
      throw new Error('Invalid name format');
    }
    if (!isValidEmail(sanitizedEmail)) {
      throw new Error('Invalid email format');
    }
    if (userData.phone && !isValidPhone(sanitizedPhone)) {
      throw new Error('Invalid phone format');
    }

    // Insert into app_users table with sanitized data
    const { data, error } = await supabase
      .from('app_users')
      .insert([{
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        role: userData.role,
        is_active: userData.is_active,
        created_by: currentUser.id
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding user to app_users:', error);
      throw new Error(`Error adding user: ${error.message}`);
    }

    // Update usage count after successful user addition
    await SubscriptionService.updateUsage();

    console.log('✅ User added successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Error in addUser:', error);
    throw error;
  }
};

// Update user information including phone
export const updateUser = async (userId: string, updates: Partial<AppUser>): Promise<boolean> => {
  try {
    console.log('📝 Updating user:', userId, updates);

    // Prepare and sanitize update data
    const updateData: any = {};
    
    if (updates.name !== undefined) {
      const sanitizedName = sanitizeUserInput(updates.name);
      if (!isValidName(sanitizedName)) {
        throw new Error('Invalid name format');
      }
      updateData.name = sanitizedName;
    }
    
    if (updates.email !== undefined) {
      const sanitizedEmail = updates.email.toLowerCase().trim();
      if (!isValidEmail(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }
      updateData.email = sanitizedEmail;
    }
    
    if (updates.phone !== undefined) {
      const sanitizedPhone = sanitizeUserInput(updates.phone);
      if (updates.phone && !isValidPhone(sanitizedPhone)) {
        throw new Error('Invalid phone format');
      }
      updateData.phone = sanitizedPhone;
    }
    
    // Role and is_active updates are handled by RLS policies
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    console.log('📝 Actual update data being sent:', updateData);

    const { error } = await supabase
      .from('app_users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('❌ Error updating user:', error);
      throw new Error(`Error updating user: ${error.message}`);
    }

    // Clear permission cache for the updated user if role or status changed
    if (updates.role !== undefined || updates.is_active !== undefined) {
      permissionCache.clearKey(`role:${userId}`);
      permissionCache.clearKey(`permission:${userId}`);
      console.log('🔄 Cleared permission cache for user:', userId);
    }

    console.log('✅ User updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error in updateUser:', error);
    throw error;
  }
};

// Delete user from app_users table
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting user:', userId);

    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('❌ Error deleting user from app_users:', error);
      throw new Error(`No se pudo eliminar el usuario: ${error.message}`);
    }

    console.log('✅ User deleted successfully from app_users');
    return true;
  } catch (error) {
    console.error('❌ Error in deleteUser:', error);
    throw error;
  }
};

// Toggle user active status
export const toggleUserStatus = async (userId: string): Promise<AppUser> => {
  try {
    console.log('🔄 Toggling user status:', userId);

    // First get current status
    const { data: currentUser, error: fetchError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching user for status toggle:', fetchError);
      throw fetchError;
    }

    // Toggle the status
    const newStatus = !currentUser.is_active;

    const { data, error } = await supabase
      .from('app_users')
      .update({ is_active: newStatus })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error toggling user status:', error);
      throw error;
    }

    console.log('✅ User status toggled successfully');
    return {
      ...data,
      role: data.role as 'admin' | 'manager' | 'worker',
      phone: data.phone || '',
    };
  } catch (error) {
    console.error('❌ Error in toggleUserStatus:', error);
    throw error;
  }
};
