
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationActionsProps {
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export const NotificationActions = ({
  unreadCount,
  onMarkAllAsRead,
  onClearAll
}: NotificationActionsProps) => {
  const { t } = useTranslation('notifications');
  
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto">
      {unreadCount > 0 && (
        <Button onClick={onMarkAllAsRead} variant="outline" size="sm" className="w-full md:w-auto">
          <CheckCircle className="w-4 h-4 mr-2" />
          {t('actions.markAllRead')}
        </Button>
      )}
      
      <Button 
        onClick={onClearAll} 
        variant="outline" 
        size="sm"
        className="text-red-600 hover:text-red-700 w-full md:w-auto"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {t('actions.clearAll')}
      </Button>
    </div>
  );
};
