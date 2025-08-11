
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

    // 1) Primary path: Supabase invoke
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-complete', {
        body: { userId },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (error) {
        console.error('❌ Edge function error (invoke):', error);
        throw new Error(error.message || 'Failed to delete user completely');
      }

      return data as CompleteUserDeletionResult;
    } catch (invokeErr: any) {
      console.warn('⚠️ Invoke failed, attempting direct fetch fallback...', invokeErr);

      // 2) Fallback: direct HTTP call to Edge Function
      const url = `https://ahwhtxygyzoadsmdrwwg.supabase.co/functions/v1/delete-user-complete`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('❌ Edge function HTTP error:', res.status, txt);
        throw new Error(`Edge Function HTTP ${res.status}`);
      }

      const json = (await res.json()) as CompleteUserDeletionResult;
      return json;
    }
  } catch (error) {
    console.error('❌ Error in deleteUserComplete:', error);
    throw error;
  }
};
