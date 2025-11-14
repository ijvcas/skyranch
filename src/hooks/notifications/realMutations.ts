
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabaseNotificationService } from '@/services/notifications/supabaseNotificationService';
import { Notification } from './types';

export const useRealNotificationMutations = () => {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => supabaseNotificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-notifications'] });
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar como leída');
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => supabaseNotificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-notifications'] });
      toast.success('Notificación eliminada');
    },
    onError: (error) => {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar notificación');
    }
  });

  const addNotificationMutation = useMutation({
    mutationFn: (notification: Omit<Notification, 'id' | 'created_at'>) => 
      supabaseNotificationService.createNotification({
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        action_required: notification.actionRequired,
        animal_name: notification.animalName
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-notifications'] });
      toast.success('Notificación creada');
    },
    onError: (error) => {
      console.error('Error creating notification:', error);
      toast.error('Error al crear notificación');
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => supabaseNotificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-notifications'] });
      toast.success('Todas las notificaciones marcadas como leídas');
    },
    onError: (error) => {
      console.error('Error marking all as read:', error);
      toast.error('Error al marcar todas como leídas');
    }
  });

  const clearAllNotificationsMutation = useMutation({
    mutationFn: () => supabaseNotificationService.clearAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-notifications'] });
      toast.success('Todas las notificaciones eliminadas');
    },
    onError: (error) => {
      console.error('Error clearing all notifications:', error);
      toast.error('Error al eliminar todas las notificaciones');
    }
  });

  const snoozeMutation = useMutation({
    mutationFn: ({ notificationId, duration }: { notificationId: string; duration: number }) => 
      supabaseNotificationService.snoozeNotification(notificationId, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-notifications'] });
    },
    onError: (error) => {
      console.error('Error snoozing notification:', error);
      toast.error('Error al posponer notificación');
    }
  });

  const markAsDoneMutation = useMutation({
    mutationFn: (notificationId: string) => supabaseNotificationService.markAsDone(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-notifications'] });
    },
    onError: (error) => {
      console.error('Error marking notification as done:', error);
      toast.error('Error al marcar como completada');
    }
  });

  return {
    markAsReadMutation,
    deleteNotificationMutation,
    addNotificationMutation,
    markAllAsReadMutation,
    clearAllNotificationsMutation,
    snoozeMutation,
    markAsDoneMutation
  };
};
