import { supabase } from '@/integrations/supabase/client';
import { NotificationType, NotificationPriority } from '@/hooks/notifications/types';
import i18n from '@/i18n/config';

export interface SupabaseNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  action_required?: boolean;
  animal_name?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

class SupabaseNotificationService {
  async getNotifications(): Promise<SupabaseNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return (data || []) as SupabaseNotification[];
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async createNotification(notification: Omit<SupabaseNotification, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        user_id: user.id
      });

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async clearAllNotifications(): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }

  async snoozeNotification(notificationId: string, durationMs: number): Promise<void> {
    const snoozedUntil = new Date(Date.now() + durationMs).toISOString();
    
    const { data: notification } = await supabase
      .from('notifications')
      .select('metadata')
      .eq('id', notificationId)
      .single();

    const currentMetadata = (notification?.metadata || {}) as Record<string, any>;
    const snoozeCount = (typeof currentMetadata.snoozeCount === 'number' ? currentMetadata.snoozeCount : 0) + 1;

    const { error } = await supabase
      .from('notifications')
      .update({ 
        metadata: {
          ...currentMetadata,
          snoozedUntil,
          snoozeCount
        }
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Error snoozing notification:', error);
      throw error;
    }
  }

  async markAsDone(notificationId: string): Promise<void> {
    const { data: notification } = await supabase
      .from('notifications')
      .select('metadata')
      .eq('id', notificationId)
      .single();

    const currentMetadata = (notification?.metadata || {}) as Record<string, any>;

    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true,
        metadata: {
          ...currentMetadata,
          markedDone: true,
          completedAt: new Date().toISOString()
        }
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as done:', error);
      throw error;
    }
  }

  // Auto-generate notifications for calendar events
  async createCalendarNotification(eventTitle: string, eventDate: string, animalName?: string, language: string = 'es'): Promise<void> {
    const formattedDate = new Date(eventDate).toLocaleDateString(language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-PT' : language === 'fr' ? 'fr-FR' : 'en-US');
    
    await this.createNotification({
      type: 'calendar',
      priority: 'medium',
      title: i18n.t('notifications:calendar.title', { lng: language, eventTitle }),
      message: i18n.t('notifications:calendar.message', { lng: language, eventTitle, eventDate: formattedDate }),
      read: false,
      action_required: true,
      animal_name: animalName
    });
  }

  // Auto-generate notifications for health records
  async createHealthNotification(animalName: string, recordType: string, dueDate?: string, language: string = 'es'): Promise<void> {
    const priority = recordType === 'vaccination' ? 'high' : 'medium';
    const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString(language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-PT' : language === 'fr' ? 'fr-FR' : 'en-US') : '';
    
    const message = dueDate 
      ? i18n.t('notifications:health.vaccination', { lng: language, animalName, dueDate: formattedDate })
      : i18n.t('notifications:health.treatment', { lng: language, animalName });

    await this.createNotification({
      type: 'health',
      priority,
      title: i18n.t('notifications:health.reminder', { lng: language, animalName }),
      message,
      read: false,
      action_required: !!dueDate,
      animal_name: animalName
    });
  }

  // Auto-generate notifications for breeding records
  async createBreedingNotification(motherName: string, fatherName: string, status: string, language: string = 'es'): Promise<void> {
    await this.createNotification({
      type: 'breeding',
      priority: 'medium',
      title: i18n.t('notifications:breeding.update', { lng: language }),
      message: i18n.t('notifications:breeding.status', { lng: language, motherName, fatherName, status }),
      read: false,
      animal_name: motherName
    });
  }
}

export const supabaseNotificationService = new SupabaseNotificationService();
