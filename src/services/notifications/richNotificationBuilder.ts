import { NotificationType, NotificationPriority, NotificationAction, NotificationChartData, RichNotificationMetadata } from '@/hooks/notifications/types';

export interface RichNotificationInput {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  animalId?: string;
  animalName?: string;
  animalImageUrl?: string;
  deepLink?: string;
  chartData?: NotificationChartData;
  actions?: NotificationAction[];
  actionRequired?: boolean;
}

export class RichNotificationBuilder {
  static buildHealthNotification(
    animalName: string,
    animalId: string,
    animalImageUrl: string,
    healthType: 'vaccination' | 'treatment' | 'checkup',
    dueDate?: string
  ): RichNotificationInput {
    const actions: NotificationAction[] = [
      {
        id: 'mark_done',
        label: 'Mark Done',
        action: 'mark_done',
        icon: 'check'
      },
      {
        id: 'snooze',
        label: 'Snooze 1 day',
        action: 'snooze',
        icon: 'clock'
      },
      {
        id: 'view',
        label: 'View Animal',
        action: 'navigate',
        target: `/animals/${animalId}`,
        icon: 'eye'
      }
    ];

    return {
      type: 'health',
      priority: healthType === 'vaccination' ? 'high' : 'medium',
      title: `${healthType === 'vaccination' ? 'Vaccination' : 'Health'} Alert: ${animalName}`,
      message: dueDate 
        ? `${animalName} has ${healthType} scheduled for ${new Date(dueDate).toLocaleDateString()}`
        : `${healthType} recorded for ${animalName}`,
      animalId,
      animalName,
      animalImageUrl,
      deepLink: `/animals/${animalId}`,
      actions,
      actionRequired: true
    };
  }

  static buildBreedingNotification(
    motherName: string,
    motherId: string,
    motherImageUrl: string,
    status: string,
    chartData?: NotificationChartData
  ): RichNotificationInput {
    const actions: NotificationAction[] = [
      {
        id: 'view',
        label: 'View Details',
        action: 'navigate',
        target: `/breeding`,
        icon: 'eye'
      },
      {
        id: 'snooze',
        label: 'Snooze',
        action: 'snooze',
        icon: 'clock'
      }
    ];

    return {
      type: 'breeding',
      priority: 'medium',
      title: `Breeding Update: ${motherName}`,
      message: `Status: ${status}`,
      animalId: motherId,
      animalName: motherName,
      animalImageUrl: motherImageUrl,
      deepLink: `/breeding`,
      chartData,
      actions,
      actionRequired: false
    };
  }

  static buildWeightAlertNotification(
    animalName: string,
    animalId: string,
    animalImageUrl: string,
    weightData: { values: number[]; labels: string[] }
  ): RichNotificationInput {
    const chartData: NotificationChartData = {
      type: 'line',
      values: weightData.values,
      labels: weightData.labels,
      color: '#ef4444'
    };

    const actions: NotificationAction[] = [
      {
        id: 'schedule_checkup',
        label: 'Schedule Checkup',
        action: 'navigate',
        target: '/calendar/new',
        icon: 'calendar'
      },
      {
        id: 'view_history',
        label: 'View History',
        action: 'navigate',
        target: `/animals/${animalId}/health`,
        icon: 'activity'
      }
    ];

    return {
      type: 'health',
      priority: 'high',
      title: `Weight Alert: ${animalName}`,
      message: `Rapid weight change detected - check animal health`,
      animalId,
      animalName,
      animalImageUrl,
      deepLink: `/animals/${animalId}/health`,
      chartData,
      actions,
      actionRequired: true
    };
  }

  static buildMetadata(input: RichNotificationInput): RichNotificationMetadata {
    return {
      imageUrl: input.animalImageUrl,
      imageAlt: input.animalName ? `Photo of ${input.animalName}` : undefined,
      thumbnailUrl: input.animalImageUrl,
      actions: input.actions,
      deepLink: input.deepLink,
      chartData: input.chartData,
      snoozedUntil: undefined,
      snoozeCount: 0
    };
  }
}
