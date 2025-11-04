import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { pushTokenService } from './pushTokenService';
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
      // Auto-update badge when notification received
      this.updateBadgeCount();
    });

    // Listen for notification actions
    await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('📱 Push notification action:', action);
      // Handle navigation based on notification data
      if (action.notification.data?.url) {
        window.location.href = action.notification.data.url;
      }
      // Clear badge when notification tapped
      this.updateBadgeCount();
    });

    console.log('✅ Push notification service initialized');
    // Set initial badge count
    await this.updateBadgeCount();
  }

  private async saveTokenToDatabase(token: string): Promise<void> {
    await pushTokenService.saveToken(token);
  }

  async getToken(): Promise<string | null> {
    return this.token;
  }

  async removeToken(): Promise<void> {
    if (!this.token) return;
    await pushTokenService.removeToken(this.token);
    this.token = null;
  }

  async setBadgeCount(count: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await PushNotifications.removeAllDeliveredNotifications();
      // Note: Capacitor doesn't have direct badge API, badge is updated via notifications
      console.log('🔴 Badge count set to:', count);
    } catch (error) {
      console.error('❌ Error setting badge count:', error);
    }
  }

  async clearBadge(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await PushNotifications.removeAllDeliveredNotifications();
      console.log('🔴 Badge cleared');
    } catch (error) {
      console.error('❌ Error clearing badge:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    if (!Capacitor.isNativePlatform()) {
      return 0;
    }

    try {
      // Calculate badge from unread notifications + upcoming events
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return 0;

      // Get unread notifications count
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('is_read', false);

      // Get upcoming events count (next 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const { data: events } = await supabase
        .from('calendar_events')
        .select('id')
        .gte('event_date', new Date().toISOString())
        .lte('event_date', sevenDaysFromNow.toISOString());

      const totalCount = (notifications?.length || 0) + (events?.length || 0);
      return totalCount;
    } catch (error) {
      console.error('❌ Error getting badge count:', error);
      return 0;
    }
  }

  async updateBadgeCount(): Promise<void> {
    const count = await this.getBadgeCount();
    await this.setBadgeCount(count);
  }

  isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const mobilePushService = new MobilePushNotificationService();
