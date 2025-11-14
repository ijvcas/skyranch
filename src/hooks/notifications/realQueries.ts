
import { useQuery } from '@tanstack/react-query';
import { supabaseNotificationService, SupabaseNotification } from '@/services/notifications/supabaseNotificationService';
import { Notification } from './types';

// Transform Supabase notification to match the existing interface
const transformNotification = (supabaseNotification: SupabaseNotification): Notification => ({
  id: supabaseNotification.id,
  type: supabaseNotification.type,
  priority: supabaseNotification.priority,
  title: supabaseNotification.title,
  message: supabaseNotification.message,
  created_at: supabaseNotification.created_at,
  read: supabaseNotification.read,
  animalName: supabaseNotification.animal_name,
  actionRequired: supabaseNotification.action_required
});

export const useRealNotificationQueries = () => {
  const { data: supabaseNotifications = [], isLoading, error } = useQuery({
    queryKey: ['real-notifications'],
    queryFn: supabaseNotificationService.getNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Transform to match existing interface
  const allNotifications = supabaseNotifications.map(transformNotification);
  
  // Filter out snoozed notifications
  const now = new Date().toISOString();
  const notifications = allNotifications.filter(n => {
    const snoozedUntil = n.metadata?.snoozedUntil;
    return !snoozedUntil || snoozedUntil <= now;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    error
  };
};
