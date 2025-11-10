
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/hooks/useNotifications';
import { NotificationIcon } from './NotificationIcon';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS, pt, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NotificationItem = ({ notification, onMarkAsRead, onDelete }: NotificationItemProps) => {
  const { t, i18n } = useTranslation('notifications');
  
  const getLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'pt': return pt;
      case 'fr': return fr;
      default: return es;
    }
  };
  
  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-600 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-300 bg-gray-50';
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      className={`
        p-3 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-gray-50
        ${getPriorityColor(notification.priority)}
        ${notification.read ? 'opacity-60' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1 min-w-0">
          <NotificationIcon type={notification.type} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-medium truncate ${
                notification.read ? 'text-gray-600' : 'text-gray-900'
              }`}>
                {notification.title}
              </h4>
              {notification.priority === 'critical' && (
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 ml-1" />
              )}
            </div>
            
            <p className={`text-xs mt-1 line-clamp-2 ${
              notification.read ? 'text-gray-500' : 'text-gray-700'
            }`}>
              {notification.message}
            </p>
            
            {notification.animalName && (
              <p className="text-xs text-blue-600 mt-1">
                {t('detail.animals')}: {notification.animalName}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(notification.created_at), { 
                  addSuffix: true, 
                  locale: getLocale() 
                })}
              </span>
              
              {notification.actionRequired && (
                <Badge variant="outline" className="text-xs h-5">
                  {t('calendar.actionRequired')}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="h-6 w-6 p-0 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
