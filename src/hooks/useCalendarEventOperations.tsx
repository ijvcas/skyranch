
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { 
  addCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent, 
  getEventNotificationUsers,
  CalendarEvent 
} from '@/services/calendarService';
import { useBreedingNotifications } from '@/hooks/useBreedingNotifications';
import { useTranslation } from 'react-i18next';

export const useCalendarEventOperations = (sendNotificationsToUsers: (selectedUserIds: string[], eventTitle: string, eventDate: string, isUpdate: boolean, eventDescription?: string) => Promise<void>) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setupPregnancyNotifications } = useBreedingNotifications();

  const createEvent = async (eventData: any, selectedUserIds: string[]) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    console.log('📅 [CREATE EVENT DEBUG] ===== CREATING CALENDAR EVENT =====');
    console.log('📅 [CREATE EVENT DEBUG] Event data:', eventData);
    console.log('📅 [CREATE EVENT DEBUG] Selected user IDs:', selectedUserIds);

    try {
      const eventId = await addCalendarEvent(eventData, selectedUserIds);
      console.log('📅 [CREATE EVENT DEBUG] Event created with ID:', eventId);
      
      if (eventId) {
        console.log('📅 [CREATE EVENT DEBUG] Starting notification process...');
        await sendNotificationsToUsers(
          selectedUserIds, 
          eventData.title, 
          eventData.eventDate, 
          false, 
          eventData.description
        );
        console.log('📅 [CREATE EVENT DEBUG] Notification process completed');

        // Check if this is a breeding-related event and setup pregnancy notifications
        if (eventData.eventType === 'breeding' && eventData.animalId) {
          console.log('🤰 Setting up pregnancy notifications for breeding event');
          try {
            await setupPregnancyNotifications(eventId);
          } catch (error) {
            console.error('Error setting up pregnancy notifications:', error);
          }
        }

        toast({
          title: t('common:messages.success'),
          description: t('calendar:messages.created')
        });
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      } else {
        console.error('📅 [CREATE EVENT DEBUG] Event creation returned null ID');
        toast({
          title: t('common:messages.error'),
          description: t('calendar:messages.createError'),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('📅 [CREATE EVENT DEBUG] Error in createEvent:', error);
      toast({
        title: t('common:messages.error'),
        description: `${t('calendar:messages.createError')}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateEvent = async (eventId: string, eventData: Partial<CalendarEvent>, selectedUserIds: string[]) => {
    console.log('📅 [UPDATE EVENT DEBUG] Updating calendar event with notification users:', selectedUserIds);
    console.log('📅 [UPDATE EVENT DEBUG] Event data:', eventData);
    
    try {
      const success = await updateCalendarEvent(eventId, eventData, selectedUserIds);
      console.log('📅 [UPDATE EVENT DEBUG] Update result:', success);
      
      if (success) {
        // Send notifications with event details
        console.log('📅 [UPDATE EVENT DEBUG] Starting notification process...');
        await sendNotificationsToUsers(
          selectedUserIds, 
          eventData.title || 'Evento', 
          eventData.eventDate || '', 
          true, 
          eventData.description
        );
        console.log('📅 [UPDATE EVENT DEBUG] Notification process completed');

        toast({
          title: t('common:messages.success'),
          description: t('calendar:messages.updated')
        });
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      } else {
        console.error('📅 [UPDATE EVENT DEBUG] Event update returned false');
        toast({
          title: t('common:messages.error'),
          description: t('calendar:messages.updateError'),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('📅 [UPDATE EVENT DEBUG] Error in updateEvent:', error);
      toast({
        title: t('common:messages.error'),
        description: `${t('calendar:messages.updateError')}: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    console.log('🗑️ [DELETE HANDLER] Starting delete handler for event:', eventId);
    
    try {
      const success = await deleteCalendarEvent(eventId);
      
      if (success) {
        console.log('🗑️ [DELETE HANDLER] Deletion successful, refreshing cache...');
        
        // Force refetch to ensure UI updates immediately
        await queryClient.refetchQueries({ 
          queryKey: ['calendar-events'],
          type: 'active'
        });
        
        console.log('🗑️ [DELETE HANDLER] Cache refreshed successfully');
        
        toast({
          title: t('common:messages.success'),
          description: t('calendar:messages.deleted')
        });
      }
    } catch (error: any) {
      console.error('🗑️ [DELETE HANDLER] Error during deletion:', error);
      toast({
        title: t('common:messages.error'),
        description: error.message || t('calendar:messages.deleteError'),
        variant: "destructive"
      });
      throw error;
    }
  };

  const getNotificationUsers = async (eventId: string): Promise<string[]> => {
    const users = await getEventNotificationUsers(eventId);
    return users;
  };

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    getNotificationUsers,
    isSubmitting
  };
};
