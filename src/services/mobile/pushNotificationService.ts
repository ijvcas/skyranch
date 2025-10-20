import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

class MobilePushNotificationService {
  private token: string | null = null;

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Push notifications only available on native platforms');
      return;
    }

    // Request permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('❌ Push notification permission denied');
      return;
    }

    // Register with OS
    await PushNotifications.register();

    // Listen for registration
    await PushNotifications.addListener('registration', async (token: Token) => {
      console.log('📱 Push registration success, token:', token.value);
      this.token = token.value;
      await this.saveTokenToDatabase(token.value);
    });

    // Listen for registration errors
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ Push registration error:', error);
    });

    // Listen for push notifications
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📱 Push notification received:', notification);
    });

    // Listen for notification actions
    await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('📱 Push notification action:', action);
      // Handle navigation based on notification data
      if (action.notification.data?.url) {
        window.location.href = action.notification.data.url;
      }
    });

    console.log('✅ Push notification service initialized');
  }

  private async saveTokenToDatabase(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform: Capacitor.getPlatform(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('❌ Error saving push token:', error);
      } else {
        console.log('✅ Push token saved to database');
      }
    } catch (error) {
      console.error('❌ Error in saveTokenToDatabase:', error);
    }
  }

  async getToken(): Promise<string | null> {
    return this.token;
  }

  async removeToken(): Promise<void> {
    if (!this.token) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', this.token);

      if (error) {
        console.error('❌ Error removing push token:', error);
      } else {
        console.log('✅ Push token removed from database');
      }

      this.token = null;
    } catch (error) {
      console.error('❌ Error in removeToken:', error);
    }
  }

  isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const mobilePushService = new MobilePushNotificationService();
