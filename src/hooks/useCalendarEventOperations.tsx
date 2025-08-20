
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

export const useCalendarEventOperations = (sendNotificationsToUsers: (selectedUserIds: string[], eventTitle: string, eventDate: string, isUpdate: boolean, eventDescription?: string) => Promise<void>) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
          title: "Éxito",
          description: "Evento creado correctamente"
        });
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      } else {
        console.error('📅 [CREATE EVENT DEBUG] Event creation returned null ID');
        toast({
          title: "Error",
          description: "No se pudo crear el evento",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('📅 [CREATE EVENT DEBUG] Error in createEvent:', error);
      toast({
        title: "Error",
        description: "Error al crear el evento: " + error.message,
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
          title: "Éxito",
          description: "Evento actualizado correctamente"
        });
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      } else {
        console.error('📅 [UPDATE EVENT DEBUG] Event update returned false');
        toast({
          title: "Error",
          description: "No se pudo actualizar el evento",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('📅 [UPDATE EVENT DEBUG] Error in updateEvent:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el evento: " + error.message,
        variant: "destructive"
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    const success = await deleteCalendarEvent(eventId);
    if (success) {
      toast({
        title: "Éxito",
        description: "Evento eliminado correctamente"
      });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    } else {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento",
        variant: "destructive"
      });
    }
  };

  const getNotificationUsers = async (eventId: string): Promise<string[]> => {
    const users = await getEventNotificationUsers(eventId);
    console.log(`📅 Retrieved notification users for event ${eventId}:`, users);
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
