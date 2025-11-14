
export type NotificationType = 
  | 'vaccine' 
  | 'health' 
  | 'breeding' 
  | 'weekly_report' 
  | 'info' 
  | 'warning' 
  | 'error' 
  | 'success'
  | 'calendar'
  | 'general';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationAction {
  id: string;
  label: string;
  action: 'navigate' | 'api_call' | 'snooze' | 'mark_done';
  target?: string;
  icon?: string;
}

export interface NotificationChartData {
  type: 'line' | 'bar' | 'pie';
  values: number[];
  labels: string[];
  color?: string;
}

export interface RichNotificationMetadata {
  imageUrl?: string;
  imageAlt?: string;
  thumbnailUrl?: string;
  actions?: NotificationAction[];
  deepLink?: string;
  chartData?: NotificationChartData;
  snoozedUntil?: string;
  snoozeCount?: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  actionRequired?: boolean;
  animalName?: string;
  metadata?: RichNotificationMetadata;
}
