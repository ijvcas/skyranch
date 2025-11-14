
import React from 'react';
import { Notification } from '@/hooks/useNotifications';
import { RichNotificationCard } from './RichNotificationCard';

interface NotificationListItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onSnooze?: (id: string, duration: number) => void;
  onMarkAsDone?: (id: string) => void;
}

export const NotificationListItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  onSnooze,
  onMarkAsDone
}: NotificationListItemProps) => {
  return (
    <RichNotificationCard 
      notification={notification}
      onMarkAsRead={onMarkAsRead}
      onDelete={onDelete}
      onSnooze={onSnooze}
      onMarkAsDone={onMarkAsDone}
    />
  );
};

