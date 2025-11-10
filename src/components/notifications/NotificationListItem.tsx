
import React from 'react';
import { CheckCircle, Trash2, AlertTriangle, Calendar, Heart, Activity, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS, pt, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface NotificationListItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NotificationListItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: NotificationListItemProps) => {
  const { t, i18n } = useTranslation('notifications');
  
  const getLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'pt': return pt;
      case 'fr': return fr;
      default: return es;
    }
  };
  
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'vaccine':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'health':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'breeding':
        return <Activity className="w-5 h-5 text-green-500" />;
      case 'weekly_report':
        return <Activity className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
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

  const getPriorityBadge = (priority: Notification['priority']) => {
    const colors = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;
    
    return (
      <Badge variant={colors[priority]} className="text-xs">
        {t(`priorities.${priority}`)}
      </Badge>
    );
  };

  const getTypeLabel = (type: Notification['type']) => {
    return t(`types.${type}`);
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`
        p-4 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-gray-50
        ${getPriorityColor(notification.priority)}
        ${notification.read ? 'opacity-60' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getNotificationIcon(notification.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={`text-sm font-medium ${
                notification.read ? 'text-gray-600' : 'text-gray-900'
              }`}>
                {notification.title}
              </h3>
              <div className="flex items-center space-x-2">
                {notification.priority === 'critical' && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                {getPriorityBadge(notification.priority)}
              </div>
            </div>
            
            <p className={`text-sm mb-2 ${
              notification.read ? 'text-gray-500' : 'text-gray-700'
            }`}>
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-xs">
                  {getTypeLabel(notification.type)}
                </Badge>
                
                {notification.animalName && (
                  <span className="text-xs text-blue-600">
                    {notification.animalName}
                  </span>
                )}
                
                {notification.actionRequired && (
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                    {t('calendar.actionRequired')}
                  </Badge>
                )}
              </div>
              
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(notification.created_at), { 
                  addSuffix: true, 
                  locale: getLocale() 
                })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-3">
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="h-8 w-8 p-0"
              title={t('actions.markAllRead')}
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            title={t('actions.clearAll')}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
