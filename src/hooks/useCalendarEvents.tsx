
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllUsers } from '@/services/userService';
import { getCalendarEvents } from '@/services/calendarService';
import { useCalendarNotifications } from '@/hooks/useCalendarNotifications';
import { useCalendarEventOperations } from '@/hooks/useCalendarEventOperations';
import { calendarNotificationScheduler } from '@/services/notifications/calendarNotificationScheduler';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCalendarEvents = () => {
  const queryClient = useQueryClient();
  
  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: getCalendarEvents
  });

  // Initialize notification scheduler and real-time subscriptions
  useEffect(() => {
    console.log('📅 Calendar notification scheduler is active');
    
    // Set up real-time subscription for calendar events
    const channel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events'
        },
        (payload) => {
          console.log('📅 [REALTIME] Calendar event change detected:', payload.eventType);
          // Refetch events when any change occurs
          queryClient.refetchQueries({ queryKey: ['calendar-events'] });
        }
      )
      .subscribe((status) => {
        console.log('📅 [REALTIME] Subscription status:', status);
      });

    return () => {
      console.log('📅 [REALTIME] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers
  });

  const { sendNotificationsToUsers } = useCalendarNotifications(users);
  const {
    createEvent,
    updateEvent,
    deleteEvent,
    getNotificationUsers,
    isSubmitting
  } = useCalendarEventOperations(sendNotificationsToUsers);

  return {
    events,
    createEvent,
    updateEvent,
    deleteEvent,
    getNotificationUsers,
    isSubmitting
  };
};
