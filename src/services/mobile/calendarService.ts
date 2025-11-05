import { Capacitor } from '@capacitor/core';

// Calendar plugin interface - cordova-plugin-calendar uses callback-based API
interface CalendarPlugin {
  hasReadWritePermission(
    successCallback: (granted: boolean) => void,
    errorCallback: (error: any) => void
  ): void;
  
  requestReadWritePermission(
    successCallback: (granted: boolean) => void,
    errorCallback: (error: any) => void
  ): void;
  
  createEvent(
    title: string,
    location: string,
    notes: string,
    startDate: Date,
    endDate: Date,
    successCallback: (message: string) => void,
    errorCallback: (error: any) => void
  ): void;
  
  modifyEvent(
    title: string,
    location: string,
    notes: string,
    startDate: Date,
    endDate: Date,
    newTitle: string,
    newLocation: string,
    newNotes: string,
    newStartDate: Date,
    newEndDate: Date,
    successCallback: (message: string) => void,
    errorCallback: (error: any) => void
  ): void;
  
  deleteEvent(
    title: string,
    location: string,
    notes: string,
    startDate: Date,
    endDate: Date,
    successCallback: (message: string) => void,
    errorCallback: (error: any) => void
  ): void;
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

    // Try to initialize with retry logic (plugin might not be immediately available)
    const tryInit = (attempts = 0) => {
      try {
        const windowWithPlugins = window as any;
        if (windowWithPlugins.plugins?.calendar) {
          this.plugin = windowWithPlugins.plugins.calendar;
          this.isPluginAvailable = true;
          console.log('📅 Calendar plugin loaded successfully');
          return;
        }
        
        // Retry up to 5 times with 500ms delay
        if (attempts < 5) {
          setTimeout(() => tryInit(attempts + 1), 500);
        } else {
          console.log('📅 Calendar plugin not available after retries - install cordova-plugin-calendar and run npx cap sync');
          this.isPluginAvailable = false;
        }
      } catch (error) {
        console.log('📅 Calendar plugin initialization error:', error);
        this.isPluginAvailable = false;
      }
    };

    tryInit();
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isPluginAvailable || !this.plugin) {
      console.log('📅 Calendar plugin not available');
      return false;
    }

    return new Promise((resolve) => {
      this.plugin!.requestReadWritePermission(
        (granted: boolean) => {
          console.log('📅 Calendar permission granted:', granted);
          resolve(granted);
        },
        (error: any) => {
          console.error('❌ Error requesting calendar permissions:', error);
          resolve(false);
        }
      );
    });
  }

  async checkPermissions(): Promise<string> {
    if (!this.isPluginAvailable || !this.plugin) {
      return 'unavailable';
    }

    return new Promise((resolve) => {
      this.plugin!.hasReadWritePermission(
        (granted: boolean) => {
          console.log('📅 Calendar permission status:', granted);
          resolve(granted ? 'granted' : 'denied');
        },
        (error: any) => {
          console.error('❌ Error checking calendar permissions:', error);
          resolve('error');
        }
      );
    });
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

      return new Promise((resolve) => {
        this.plugin!.createEvent(
          event.title,
          event.location || '',
          event.notes || '',
          event.startDate,
          event.endDate,
          (message: string) => {
            console.log('📅 Calendar event created:', message);
            resolve(message);
          },
          (error: any) => {
            console.error('❌ Error creating calendar event:', error);
            resolve(null);
          }
        );
      });
    } catch (error) {
      console.error('❌ Error creating calendar event:', error);
      return null;
    }
  }

  async updateEvent(
    oldEvent: FarmikaCalendarEvent,
    newEvent: FarmikaCalendarEvent
  ): Promise<boolean> {
    if (!this.isPluginAvailable || !this.plugin) {
      console.log('📅 Calendar plugin not available, skipping event update');
      return false;
    }

    try {
      return new Promise((resolve) => {
        this.plugin!.modifyEvent(
          oldEvent.title,
          oldEvent.location || '',
          oldEvent.notes || '',
          oldEvent.startDate,
          oldEvent.endDate,
          newEvent.title,
          newEvent.location || '',
          newEvent.notes || '',
          newEvent.startDate,
          newEvent.endDate,
          (message: string) => {
            console.log('📅 Calendar event updated:', message);
            resolve(true);
          },
          (error: any) => {
            console.error('❌ Error updating calendar event:', error);
            resolve(false);
          }
        );
      });
    } catch (error) {
      console.error('❌ Error updating calendar event:', error);
      return false;
    }
  }

  async deleteEvent(event: FarmikaCalendarEvent): Promise<boolean> {
    if (!this.isPluginAvailable || !this.plugin) {
      console.log('📅 Calendar plugin not available, skipping event deletion');
      return false;
    }

    try {
      return new Promise((resolve) => {
        this.plugin!.deleteEvent(
          event.title,
          event.location || '',
          event.notes || '',
          event.startDate,
          event.endDate,
          (message: string) => {
            console.log('📅 Calendar event deleted:', message);
            resolve(true);
          },
          (error: any) => {
            console.error('❌ Error deleting calendar event:', error);
            resolve(false);
          }
        );
      });
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
