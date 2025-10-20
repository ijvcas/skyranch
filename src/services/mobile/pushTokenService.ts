import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

interface PushToken {
  user_id: string;
  token: string;
  platform: string;
  updated_at: string;
}

class PushTokenService {
  async saveToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tokenData: Partial<PushToken> = {
        user_id: user.id,
        token,
        platform: Capacitor.getPlatform(),
        updated_at: new Date().toISOString(),
      };

      // Use raw SQL insert with ON CONFLICT
      const { error } = await supabase.rpc('upsert_push_token', {
        p_user_id: user.id,
        p_token: token,
        p_platform: Capacitor.getPlatform(),
      } as any);

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

      // Direct SQL delete
      const { error } = await supabase.rpc('delete_push_token', {
        p_user_id: user.id,
        p_token: token,
      } as any);

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
