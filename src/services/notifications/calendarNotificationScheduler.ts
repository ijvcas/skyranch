import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/services/calendarService';
import { pushNotificationService } from './core/pushNotificationService';

export class CalendarNotificationScheduler {
  private checkInterval: number = 60000; // Check every minute
  private notificationsSent: Set<string> = new Set();

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    console.log('📅 Starting calendar notification monitoring...');
    
    // Check immediately and then every minute
    this.checkUpcomingEvents();
    setInterval(() => {
      this.checkUpcomingEvents();
    }, this.checkInterval);
  }

  private async checkUpcomingEvents() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Get events happening tomorrow
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          event_notifications (
            user_id
          )
        `)
        .gte('event_date', tomorrow.toISOString())
        .lt('event_date', dayAfterTomorrow.toISOString())
        .eq('status', 'scheduled');

      if (error) {
        console.error('❌ Error fetching calendar events for notifications:', error);
        return;
      }

      if (!events || events.length === 0) {
        return;
      }

      console.log(`📅 Found ${events.length} events happening tomorrow`);

      for (const event of events) {
        await this.processEventNotifications(event);
      }
    } catch (error) {
      console.error('❌ Error checking upcoming events:', error);
    }
  }

  private async processEventNotifications(event: any) {
    const eventKey = `${event.id}-${event.event_date}`;
    
    // Skip if we already sent notification for this event
    if (this.notificationsSent.has(eventKey)) {
      return;
    }

    try {
      // Get users who should be notified
      const userIds = event.event_notifications?.map((n: any) => n.user_id) || [];
      
      if (userIds.length === 0) {
        console.log(`📅 No users to notify for event: ${event.title}`);
        return;
      }

      // Get user information
      const { data: users, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) {
        console.error('❌ Error fetching users for notifications:', usersError);
        return;
      }

      const eventDate = new Date(event.event_date);
      const title = `Recordatorio: ${event.title}`;
      const body = `Tienes un evento mañana (${eventDate.toLocaleDateString('es-ES')}): ${event.title}`;

      // Send push notifications to each user
      for (const user of users || []) {
        try {
          console.log(`📱 Sending push notification to ${user.name} for event: ${event.title}`);
          
          await pushNotificationService.sendPushNotification(
            user.id,
            title,
            body
          );

          console.log(`✅ Push notification sent to ${user.name}`);
        } catch (error) {
          console.error(`❌ Failed to send push notification to ${user.name}:`, error);
        }
      }

      // Mark this notification as sent
      this.notificationsSent.add(eventKey);
      
      console.log(`✅ Processed notifications for event: ${event.title}`);
    } catch (error) {
      console.error(`❌ Error processing notifications for event ${event.title}:`, error);
    }
  }

  // Method to manually trigger notification check (for testing)
  public async triggerNotificationCheck() {
    console.log('📅 Manually triggering notification check...');
    await this.checkUpcomingEvents();
  }

  // Clean up sent notifications older than 7 days
  private cleanupSentNotifications() {
    // This is a simple in-memory cleanup - in production you might want to persist this
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const keysToRemove = Array.from(this.notificationsSent).filter(key => {
      // Extract date from key and check if it's older than 7 days
      const eventDate = key.split('-').slice(1).join('-');
      return new Date(eventDate).getTime() < sevenDaysAgo;
    });
    
    keysToRemove.forEach(key => this.notificationsSent.delete(key));
  }
}

// Create singleton instance
export const calendarNotificationScheduler = new CalendarNotificationScheduler();

// Clean up old notifications daily
setInterval(() => {
  calendarNotificationScheduler['cleanupSentNotifications']();
}, 24 * 60 * 60 * 1000); // Daily cleanup