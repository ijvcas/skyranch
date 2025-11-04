import { LocalNotifications, ScheduleOptions, PendingResult } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface ScheduledNotification {
  id: number;
  title: string;
  body: string;
  scheduledAt: Date;
  extra?: any;
}

class LocalNotificationService {
  private notificationIdCounter = 1;

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('🔔 Local notifications only available on native platforms');
      return;
    }

    // Request permissions
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display === 'prompt') {
      await LocalNotifications.requestPermissions();
    }

    // Listen for notification actions
    await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('🔔 Local notification action performed:', notification);
      // Handle notification tap - navigate to relevant page
      if (notification.notification.extra?.url) {
        window.location.href = notification.notification.extra.url;
      }
    });

    console.log('✅ Local notification service initialized');
  }

  async scheduleNotification(
    title: string,
    body: string,
    scheduledDate: Date,
    extra?: any
  ): Promise<number> {
    if (!Capacitor.isNativePlatform()) {
      console.log('🔔 Skipping notification schedule (web platform)');
      return -1;
    }

    const id = this.notificationIdCounter++;
    
    const options: ScheduleOptions = {
      notifications: [{
        id,
        title,
        body,
        schedule: { at: scheduledDate },
        extra
      }]
    };

    await LocalNotifications.schedule(options);
    console.log(`🔔 Scheduled notification ${id} for ${scheduledDate.toISOString()}`);
    return id;
  }

  async cancelNotification(id: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    await LocalNotifications.cancel({ notifications: [{ id }] });
    console.log(`🔔 Cancelled notification ${id}`);
  }

  async cancelAllNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const pending = await this.getPendingNotifications();
    if (pending.length > 0) {
      await LocalNotifications.cancel({ 
        notifications: pending.map(n => ({ id: n.id })) 
      });
      console.log(`🔔 Cancelled all ${pending.length} notifications`);
    }
  }

  async getPendingNotifications(): Promise<ScheduledNotification[]> {
    if (!Capacitor.isNativePlatform()) {
      return [];
    }

    const result: PendingResult = await LocalNotifications.getPending();
    return result.notifications.map(n => ({
      id: n.id,
      title: n.title || '',
      body: n.body || '',
      scheduledAt: n.schedule?.at ? new Date(n.schedule.at) : new Date(),
      extra: n.extra
    }));
  }

  async scheduleBreedingReminders(
    animalName: string,
    expectedBirthDate: Date,
    animalId: string
  ): Promise<number[]> {
    const notificationIds: number[] = [];

    // 90 days before
    const ninetyDaysBefore = new Date(expectedBirthDate);
    ninetyDaysBefore.setDate(ninetyDaysBefore.getDate() - 90);
    if (ninetyDaysBefore > new Date()) {
      const id = await this.scheduleNotification(
        '🐮 Recordatorio de Gestación',
        `${animalName}: 3 meses para la fecha esperada de parto`,
        ninetyDaysBefore,
        { type: 'breeding', animalId, url: `/animals/${animalId}` }
      );
      notificationIds.push(id);
    }

    // 7 days before
    const sevenDaysBefore = new Date(expectedBirthDate);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
    if (sevenDaysBefore > new Date()) {
      const id = await this.scheduleNotification(
        '🐮 Recordatorio de Parto Próximo',
        `${animalName}: 7 días para la fecha esperada de parto`,
        sevenDaysBefore,
        { type: 'breeding', animalId, url: `/animals/${animalId}` }
      );
      notificationIds.push(id);
    }

    // 1 day before
    const oneDayBefore = new Date(expectedBirthDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    if (oneDayBefore > new Date()) {
      const id = await this.scheduleNotification(
        '🐮 Recordatorio de Parto Inminente',
        `${animalName}: Fecha esperada de parto mañana`,
        oneDayBefore,
        { type: 'breeding', animalId, url: `/animals/${animalId}` }
      );
      notificationIds.push(id);
    }

    return notificationIds;
  }

  async scheduleEventReminder(
    eventTitle: string,
    eventDate: Date,
    eventId: string
  ): Promise<number> {
    const oneHourBefore = new Date(eventDate);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);

    if (oneHourBefore <= new Date()) {
      return -1; // Don't schedule if event is too soon
    }

    return await this.scheduleNotification(
      '📅 Recordatorio de Evento',
      `${eventTitle} en 1 hora`,
      oneHourBefore,
      { type: 'event', eventId, url: `/calendar` }
    );
  }

  isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const localNotificationService = new LocalNotificationService();
