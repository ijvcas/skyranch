import { supabase } from '@/integrations/supabase/client';
import { calendarService, FarmikaCalendarEvent } from './calendarService';
import { Capacitor } from '@capacitor/core';

class CalendarSyncService {
  private channel: any = null;
  private isInitialized = false;

  /**
   * Check if calendar sync is enabled in localStorage
   */
  private isSyncEnabled(): boolean {
    return localStorage.getItem('farmika_calendar_sync') === 'true' && Capacitor.isNativePlatform();
  }

  /**
   * Transform Supabase calendar event to iOS calendar format
   */
  private transformToIOSEvent(supabaseEvent: any): FarmikaCalendarEvent {
    return {
      title: supabaseEvent.title,
      startDate: new Date(supabaseEvent.event_date),
      endDate: supabaseEvent.end_date 
        ? new Date(supabaseEvent.end_date) 
        : new Date(supabaseEvent.event_date),
      notes: supabaseEvent.description || '',
      location: supabaseEvent.location || '',
      allDay: supabaseEvent.all_day || false
    };
  }

  /**
   * Sync a single event to iOS calendar
   */
  private async syncEventToIOS(supabaseEvent: any): Promise<void> {
    if (!this.isSyncEnabled()) {
      console.log('📅 [CalendarSync] Sync disabled, skipping');
      return;
    }

    try {
      const iosEvent = this.transformToIOSEvent(supabaseEvent);
      console.log('📅 [CalendarSync] Syncing event to iOS:', iosEvent.title);
      
      const eventId = await calendarService.createEvent(iosEvent);
      
      if (eventId) {
        console.log('✅ [CalendarSync] Event synced successfully:', eventId);
      }
    } catch (error) {
      console.error('❌ [CalendarSync] Failed to sync event:', error);
    }
  }

  /**
   * Sync all existing events from Supabase to iOS calendar
   */
  async syncAllExistingEvents(): Promise<{ success: number; failed: number }> {
    if (!this.isSyncEnabled()) {
      console.log('📅 [CalendarSync] Sync disabled');
      return { success: 0, failed: 0 };
    }

    console.log('📅 [CalendarSync] Starting full sync of existing events...');
    
    try {
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;

      let successCount = 0;
      let failedCount = 0;

      for (const event of events || []) {
        try {
          await this.syncEventToIOS(event);
          successCount++;
        } catch (error) {
          console.error('❌ [CalendarSync] Failed to sync event:', event.title, error);
          failedCount++;
        }
      }

      console.log(`✅ [CalendarSync] Full sync complete: ${successCount} success, ${failedCount} failed`);
      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('❌ [CalendarSync] Full sync failed:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Start real-time synchronization with Supabase calendar_events
   */
  startRealtimeSync(): void {
    if (this.isInitialized) {
      console.log('📅 [CalendarSync] Already initialized');
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      console.log('📅 [CalendarSync] Not on native platform, skipping');
      return;
    }

    console.log('📅 [CalendarSync] Initializing real-time sync...');

    this.channel = supabase
      .channel('calendar-events-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calendar_events'
        },
        (payload) => {
          console.log('📅 [CalendarSync] New event detected:', payload.new);
          this.syncEventToIOS(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calendar_events'
        },
        (payload) => {
          console.log('📅 [CalendarSync] Event updated:', payload.new);
          // For updates, we'd need to track event IDs - for now just create new
          this.syncEventToIOS(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'calendar_events'
        },
        (payload) => {
          console.log('📅 [CalendarSync] Event deleted:', payload.old);
          // iOS calendar deletion would require tracking event IDs
          // For now, users can manually delete from iOS Calendar
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [CalendarSync] Real-time sync active');
          this.isInitialized = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [CalendarSync] Channel error');
        }
      });
  }

  /**
   * Stop real-time synchronization
   */
  stopRealtimeSync(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.isInitialized = false;
      console.log('🛑 [CalendarSync] Real-time sync stopped');
    }
  }
}

export const calendarSyncService = new CalendarSyncService();
