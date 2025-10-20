import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

class PushTokenService {
  async saveToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Direct SQL execution via RPC (bypasses type checking)
      const { error } = await (supabase as any).rpc('upsert_push_token', {
        p_user_id: user.id,
        p_token: token,
        p_platform: Capacitor.getPlatform(),
      });

      if (error) {
        console.error('❌ Error saving push token:', error);
      } else {
        console.log('✅ Push token saved');
      }
    } catch (error) {
      console.error('❌ Error in saveToken:', error);
    }
  }

  async removeToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Direct SQL execution via RPC (bypasses type checking)
      const { error } = await (supabase as any).rpc('delete_push_token', {
        p_user_id: user.id,
        p_token: token,
      });

      if (error) {
        console.error('❌ Error removing push token:', error);
      } else {
        console.log('✅ Push token removed');
      }
    } catch (error) {
      console.error('❌ Error in removeToken:', error);
    }
  }
}

export const pushTokenService = new PushTokenService();
