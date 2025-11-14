import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/hooks/useNotifications';
import { NotificationIcon } from './NotificationIcon';
import { NotificationImage } from './NotificationImage';
import { NotificationChart } from './NotificationChart';
import { NotificationActionButtons } from './NotificationActionButtons';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS, pt, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface RichNotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAsDone?: (id: string) => void;
  onSnooze?: (id: string, duration: number) => void;
}

export const RichNotificationCard = ({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  onMarkAsDone,
  onSnooze 
}: RichNotificationCardProps) => {
  const { t, i18n } = useTranslation('notifications');
  const [isExpanded, setIsExpanded] = useState(false);
  
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
        return 'border-l-destructive bg-destructive/5';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'low':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'border-l-border bg-muted/30';
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    setIsExpanded(!isExpanded);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  const hasRichContent = notification.metadata?.imageUrl || notification.metadata?.chartData;

  return (
    <div
      className={`
        p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md
        ${getPriorityColor(notification.priority)}
        ${notification.read ? 'opacity-60' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        {notification.metadata?.thumbnailUrl && (
          <NotificationImage 
            src={notification.metadata.thumbnailUrl}
            alt={notification.metadata.imageAlt}
            thumbnail
            className="flex-shrink-0"
          />
        )}
        
        {!notification.metadata?.thumbnailUrl && (
          <NotificationIcon type={notification.type} />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium truncate ${
              notification.read ? 'text-muted-foreground' : 'text-foreground'
            }`}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {notification.priority === 'critical' && (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
              {hasRichContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-5 w-5 p-0 hover:bg-destructive/10"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <p className={`text-xs mt-1 ${
            isExpanded ? '' : 'line-clamp-2'
          } ${
            notification.read ? 'text-muted-foreground' : 'text-foreground/80'
          }`}>
            {notification.message}
          </p>
          
          {notification.animalName && (
            <p className="text-xs text-primary mt-1">
              {notification.animalName}
            </p>
          )}
          
          {/* Expanded Content */}
          {isExpanded && hasRichContent && (
            <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
              {notification.metadata?.imageUrl && (
                <NotificationImage 
                  src={notification.metadata.imageUrl}
                  alt={notification.metadata.imageAlt}
                />
              )}
              
              {notification.metadata?.chartData && (
                <NotificationChart chartData={notification.metadata.chartData} />
              )}
            </div>
          )}

          {/* Action Buttons */}
          {notification.metadata?.actions && (
            <NotificationActionButtons
              actions={notification.metadata.actions}
              notificationId={notification.id}
              onMarkAsDone={onMarkAsDone}
              onSnooze={onSnooze}
            />
          )}
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
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
    </div>
  );
};
