import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Eye, Calendar, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationAction } from '@/hooks/notifications/types';
import { toast } from 'sonner';

interface NotificationActionButtonsProps {
  actions?: NotificationAction[];
  notificationId: string;
  onMarkAsDone?: (id: string) => void;
  onSnooze?: (id: string, duration: number) => void;
  className?: string;
}

export const NotificationActionButtons = ({ 
  actions = [], 
  notificationId,
  onMarkAsDone,
  onSnooze,
  className = '' 
}: NotificationActionButtonsProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'check': return <Check className="w-3 h-3" />;
      case 'clock': return <Clock className="w-3 h-3" />;
      case 'eye': return <Eye className="w-3 h-3" />;
      case 'calendar': return <Calendar className="w-3 h-3" />;
      case 'activity': return <Activity className="w-3 h-3" />;
      default: return null;
    }
  };

  const handleAction = async (action: NotificationAction, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(action.id);

    try {
      if (action.action === 'navigate' && action.target) {
        navigate(action.target);
      } else if (action.action === 'mark_done' && onMarkAsDone) {
        await onMarkAsDone(notificationId);
        toast.success('Marked as done');
      } else if (action.action === 'snooze' && onSnooze) {
        // Default snooze: 1 day (86400000 ms)
        await onSnooze(notificationId, 86400000);
        toast.success('Snoozed for 1 day');
      } else if (action.action === 'api_call' && action.target) {
        // Handle API calls if needed in the future
        console.log('API call:', action.target);
      }
    } catch (error) {
      console.error('Error handling action:', error);
      toast.error('Failed to perform action');
    } finally {
      setLoading(null);
    }
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 mt-3 ${className}`}>
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          onClick={(e) => handleAction(action, e)}
          disabled={loading === action.id}
          className="h-7 text-xs"
        >
          {getIcon(action.icon)}
          <span className="ml-1">{action.label}</span>
        </Button>
      ))}
    </div>
  );
};
