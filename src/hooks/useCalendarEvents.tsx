
import { useQuery } from '@tanstack/react-query';
import { getAllUsers } from '@/services/userService';
import { getCalendarEvents } from '@/services/calendarService';
import { useCalendarNotifications } from '@/hooks/useCalendarNotifications';
import { useCalendarEventOperations } from '@/hooks/useCalendarEventOperations';
import { calendarNotificationScheduler } from '@/services/notifications/calendarNotificationScheduler';
import { useEffect } from 'react';

export const useCalendarEvents = () => {
  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: getCalendarEvents
  });

  // Initialize notification scheduler
  useEffect(() => {
    // The scheduler is automatically initialized when imported
    console.log('📅 Calendar notification scheduler is active');
  }, []);

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
