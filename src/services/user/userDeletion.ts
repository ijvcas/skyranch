
import { supabase } from '@/integrations/supabase/client';

export interface CompleteUserDeletionResult {
  success: boolean;
  warning?: string;
  error?: string;
}

// Complete user deletion that removes from both app_users and auth.users
export const deleteUserComplete = async (userId: string): Promise<CompleteUserDeletionResult> => {
  try {
    console.log('🗑️ Starting complete user deletion:', userId);

    // Ensure we send the auth token explicitly to the Edge Function
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    const { data, error } = await supabase.functions.invoke('delete-user-complete', {
      body: { userId },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      throw new Error(error.message || 'Failed to delete user completely');
    }

    if (!data.success) {
      throw new Error(data.error || 'User deletion failed');
    }

    console.log('✅ Complete user deletion successful');
    return data;
  } catch (error) {
    console.error('❌ Error in deleteUserComplete:', error);
    throw error;
  }
};
