import { Capacitor } from '@capacitor/core';

// Calendar plugin interface - will work when cordova-plugin-calendar is installed
interface CalendarPlugin {
  requestReadWritePermission(): Promise<{ result: boolean }>;
  checkPermission(): Promise<{ result: string }>;
  createEvent(options: CalendarEventOptions): Promise<{ result: string }>;
  modifyEvent(options: CalendarEventOptions & { id: string }): Promise<{ result: boolean }>;
  deleteEvent(options: { id: string }): Promise<{ result: boolean }>;
}

interface CalendarEventOptions {
  title: string;
  calendarId?: string;
  location?: string;
  startDate?: number;
  endDate?: number;
  notes?: string;
  url?: string;
  recurrence?: string;
  recurrenceEndDate?: number;
  allDay?: boolean;
}

export interface FarmikaCalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  location?: string;
  allDay?: boolean;
}

class CalendarService {
  private plugin: CalendarPlugin | null = null;
  private isPluginAvailable: boolean = false;

  constructor() {
    // Check if plugin is available
    this.initializePlugin();
  }

  private initializePlugin() {
    if (!Capacitor.isNativePlatform()) {
      this.isPluginAvailable = false;
      return;
    }

    // Check if window.plugins.calendar exists (from cordova-plugin-calendar)
    try {
      const windowWithPlugins = window as any;
      if (windowWithPlugins.plugins && windowWithPlugins.plugins.calendar) {
        this.plugin = windowWithPlugins.plugins.calendar;
        this.isPluginAvailable = true;
        console.log('📅 Calendar plugin loaded successfully');
      } else {
        console.log('📅 Calendar plugin not installed yet - install cordova-plugin-calendar and run npx cap sync');
        this.isPluginAvailable = false;
      }
    } catch (error) {
      console.log('📅 Calendar plugin not available:', error);
      this.isPluginAvailable = false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isPluginAvailable || !this.plugin) {
      console.log('📅 Calendar plugin not available');
      return false;
    }

    try {
      const result = await this.plugin.requestReadWritePermission();
      console.log('📅 Calendar permission request result:', result);
      return result.result;
    } catch (error) {
      console.error('❌ Error requesting calendar permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<string> {
    if (!this.isPluginAvailable || !this.plugin) {
      return 'unavailable';
    }

    try {
      const result = await this.plugin.checkPermission();
      return result.result; // 'granted', 'denied', 'notDetermined'
    } catch (error) {
      console.error('❌ Error checking calendar permissions:', error);
      return 'error';
    }
  }

  async createEvent(event: FarmikaCalendarEvent): Promise<string | null> {
    if (!this.isPluginAvailable || !this.plugin) {
      console.log('📅 Calendar plugin not available, skipping event creation');
      return null;
    }

    try {
      // Check permissions first
      const permission = await this.checkPermissions();
      if (permission !== 'granted') {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.log('📅 Calendar permission not granted');
          return null;
        }
      }

      const options: CalendarEventOptions = {
        title: event.title,
        location: event.location || '',
        startDate: event.startDate.getTime(),
        endDate: event.endDate.getTime(),
        notes: event.notes || '',
        allDay: event.allDay || false,
      };

      const result = await this.plugin.createEvent(options);
      console.log('📅 Calendar event created:', result.result);
      return result.result;
    } catch (error) {
      console.error('❌ Error creating calendar event:', error);
      return null;
    }
  }

  async updateEvent(eventId: string, event: FarmikaCalendarEvent): Promise<boolean> {
    if (!this.isPluginAvailable || !this.plugin) {
      console.log('📅 Calendar plugin not available, skipping event update');
      return false;
    }

    try {
      const options: CalendarEventOptions & { id: string } = {
        id: eventId,
        title: event.title,
        location: event.location || '',
        startDate: event.startDate.getTime(),
        endDate: event.endDate.getTime(),
        notes: event.notes || '',
        allDay: event.allDay || false,
      };

      const result = await this.plugin.modifyEvent(options);
      console.log('📅 Calendar event updated:', result.result);
      return result.result;
    } catch (error) {
      console.error('❌ Error updating calendar event:', error);
      return false;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.isPluginAvailable || !this.plugin) {
      console.log('📅 Calendar plugin not available, skipping event deletion');
      return false;
    }

    try {
      const result = await this.plugin.deleteEvent({ id: eventId });
      console.log('📅 Calendar event deleted:', result.result);
      return result.result;
    } catch (error) {
      console.error('❌ Error deleting calendar event:', error);
      return false;
    }
  }

  isAvailable(): boolean {
    return this.isPluginAvailable && Capacitor.isNativePlatform();
  }
}

export const calendarService = new CalendarService();
