
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabaseNotificationService } from '@/services/notifications/supabaseNotificationService';
import { pushService } from '@/services/notifications/pushService';
import { supabase } from '@/integrations/supabase/client';

export class CalendarNotificationManager {
  private toast: ReturnType<typeof useToast>['toast'];
  private queryClient: ReturnType<typeof useQueryClient>;

  constructor(toast: ReturnType<typeof useToast>['toast'], queryClient: ReturnType<typeof useQueryClient>) {
    this.toast = toast;
    this.queryClient = queryClient;
  }

  async createInAppNotification(eventTitle: string, eventDate: string) {
    try {
      console.log('🔄 [CALENDAR NOTIFICATION MANAGER] Creating in-app notification...');
      
      // Fetch user's language preference
      const { data: { user } } = await supabase.auth.getUser();
      let language = 'es'; // Default
      
      if (user) {
        const { data: userData } = await supabase
          .from('app_users')
          .select('preferred_language')
          .eq('id', user.id)
          .single();
        
        language = userData?.preferred_language || 'es';
        console.log('🌐 [CALENDAR NOTIFICATION MANAGER] User language:', language);
      }
      
      await supabaseNotificationService.createCalendarNotification(eventTitle, eventDate, undefined, language);
      console.log('✅ [CALENDAR NOTIFICATION MANAGER] In-app notification created successfully');
    } catch (error) {
      console.error('❌ [CALENDAR NOTIFICATION MANAGER] Error creating in-app notification:', error);
    }
  }

  checkNotificationPermissions() {
    const permissionStatus = pushService.getPermissionStatus();
    console.log(`📱 [CALENDAR NOTIFICATION MANAGER] Notification permission status: ${permissionStatus}`);

    if (permissionStatus !== 'granted' && pushService.isSupported()) {
      this.toast({
        title: "Permisos de notificación",
        description: "Para recibir notificaciones push, permite las notificaciones en tu navegador",
        variant: "destructive"
      });
    }
  }

  refreshNotifications() {
    this.queryClient.invalidateQueries({ queryKey: ['real-notifications'] });
  }
}
