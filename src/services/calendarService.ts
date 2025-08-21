
import { supabase } from '@/integrations/supabase/client';

export interface CalendarEvent {
  id: string;
  userId: string;
  animalId?: string; // Keep for backward compatibility
  animalIds?: string[]; // New field for multiple animals
  title: string;
  description?: string;
  eventType: 'vaccination' | 'checkup' | 'breeding' | 'feeding' | 'treatment' | 'appointment' | 'reminder';
  eventDate: string;
  endDate?: string;
  allDay: boolean;
  recurring: boolean;
  recurrencePattern?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  reminderMinutes: number;
  veterinarian?: string;
  location?: string;
  cost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
}

export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  try {
    console.log('🔄 Fetching calendar events...');
    
    // First get the events
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true });

    if (eventsError) {
      console.error('❌ Error fetching calendar events:', eventsError);
      throw eventsError;
    }

    console.log('✅ Calendar events fetched:', events?.length || 0);
    
    // Log the specific event we're interested in
    const vaccinationEvent = events?.find(e => e.title === 'Vacunación Ovinos');
    if (vaccinationEvent) {
      console.log('🐄 [DEBUG] Vaccination event animal_ids from DB:', vaccinationEvent.animal_ids);
    }

    if (!events || events.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(events.map(e => e.user_id))];
    console.log('🔍 Fetching user names for event creators:', userIds);

    // Get user names
    const { data: users, error: usersError } = await supabase
      .from('app_users')
      .select('id, name')
      .in('id', userIds);

    if (usersError) {
      console.error('⚠️ Error fetching user names:', usersError);
      // Don't throw, just continue without names
    }

    console.log('✅ Users fetched for events:', users?.length || 0);

    // Map events with creator names and ensure proper animal data retrieval
    return events.map(event => ({
      id: event.id,
      userId: event.user_id,
      animalId: event.animal_id || undefined,
      animalIds: event.animal_ids || [], // Ensure empty array instead of undefined
      title: event.title,
      description: event.description || undefined,
      eventType: event.event_type as CalendarEvent['eventType'],
      eventDate: event.event_date,
      endDate: event.end_date || undefined,
      allDay: event.all_day || false,
      recurring: event.recurring || false,
      recurrencePattern: event.recurrence_pattern || undefined,
      status: event.status as CalendarEvent['status'],
      reminderMinutes: event.reminder_minutes || 60,
      veterinarian: event.veterinarian || undefined,
      location: event.location || undefined,
      cost: event.cost || undefined,
      notes: event.notes || undefined,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      createdByName: users?.find(u => u.id === event.user_id)?.name
    }));
  } catch (error) {
    console.error('💥 Calendar events service error:', error);
    throw error;
  }
};

export const getEventNotificationUsers = async (eventId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('event_notifications')
    .select('user_id')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching event notification users:', error);
    return [];
  }

  return data?.map(item => item.user_id) || [];
};

export const addCalendarEvent = async (
  event: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  selectedUserIds: string[]
): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user');
    return null;
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      user_id: user.id,
      animal_id: event.animalId || null,
      animal_ids: event.animalIds || null,
      title: event.title,
      description: event.description || null,
      event_type: event.eventType,
      event_date: event.eventDate,
      end_date: event.endDate || null,
      all_day: event.allDay,
      recurring: event.recurring,
      recurrence_pattern: event.recurrencePattern || null,
      status: event.status,
      reminder_minutes: event.reminderMinutes,
      veterinarian: event.veterinarian || null,
      location: event.location || null,
      cost: event.cost || null,
      notes: event.notes || null
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error adding calendar event:', error);
    return null;
  }

  const eventId = data.id;

  // Add event notifications for selected users
  if (selectedUserIds.length > 0) {
    const notifications = selectedUserIds.map(userId => ({
      event_id: eventId,
      user_id: userId
    }));

    const { error: notificationError } = await supabase
      .from('event_notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Error adding event notifications:', notificationError);
    }
  }

  return eventId;
};

export const updateCalendarEvent = async (
  id: string, 
  updatedData: Partial<Omit<CalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  selectedUserIds: string[]
): Promise<boolean> => {
  console.log('📅 [UPDATE SERVICE] Starting update for event:', id);
  console.log('📅 [UPDATE SERVICE] Updating event with animalIds:', updatedData.animalIds);
  
  try {
    // Get current user and session info for debugging
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('🔐 [AUTH DEBUG] Current user:', user?.id);
    console.log('🔐 [AUTH DEBUG] Session exists:', !!session);
    console.log('🔐 [AUTH DEBUG] User error:', userError);
    console.log('🔐 [AUTH DEBUG] Session error:', sessionError);

    if (userError || !user) {
      console.error('❌ [UPDATE SERVICE] Authentication failed:', userError);
      throw new Error('Usuario no autenticado');
    }

    // Check the event exists and get its details  
    const { data: eventCheck, error: checkError } = await supabase
      .from('calendar_events')
      .select('id, user_id, title')
      .eq('id', id)
      .single();
      
    console.log('🔍 [EVENT DEBUG] Event check result:', eventCheck);
    console.log('🔍 [EVENT DEBUG] Check error:', checkError);
      
    if (checkError) {
      console.error('❌ [UPDATE SERVICE] Event lookup failed:', checkError);
      if (checkError.code === 'PGRST116') {
        throw new Error('Evento no encontrado');
      }
      throw new Error('Error al buscar el evento');
    }
    
    if (!eventCheck) {
      console.error('❌ [UPDATE SERVICE] Event not found');
      throw new Error('Evento no encontrado');
    }
    
    console.log('📊 [PERMISSION DEBUG] Event owner:', eventCheck.user_id);
    console.log('📊 [PERMISSION DEBUG] Current user:', user.id);
    console.log('📊 [PERMISSION DEBUG] Match:', eventCheck.user_id === user.id);

    // Build update payload
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };

    // Only add fields that are actually changing
    if (updatedData.title !== undefined) updatePayload.title = updatedData.title;
    if (updatedData.description !== undefined) updatePayload.description = updatedData.description || null;
    if (updatedData.eventType !== undefined) updatePayload.event_type = updatedData.eventType;
    if (updatedData.eventDate !== undefined) updatePayload.event_date = updatedData.eventDate;
    if (updatedData.endDate !== undefined) updatePayload.end_date = updatedData.endDate || null;
    if (updatedData.allDay !== undefined) updatePayload.all_day = updatedData.allDay;
    if (updatedData.reminderMinutes !== undefined) updatePayload.reminder_minutes = updatedData.reminderMinutes;
    if (updatedData.veterinarian !== undefined) updatePayload.veterinarian = updatedData.veterinarian || null;
    if (updatedData.location !== undefined) updatePayload.location = updatedData.location || null;
    if (updatedData.cost !== undefined) updatePayload.cost = updatedData.cost || null;
    if (updatedData.notes !== undefined) updatePayload.notes = updatedData.notes || null;
    
    // Handle animal IDs
    if (updatedData.animalIds !== undefined) {
      if (Array.isArray(updatedData.animalIds) && updatedData.animalIds.length > 0) {
        updatePayload.animal_ids = updatedData.animalIds;
      } else {
        updatePayload.animal_ids = null;
      }
      console.log('🐄 [ANIMAL DEBUG] Setting animal_ids to:', updatePayload.animal_ids);
    }

    console.log('📦 [UPDATE DEBUG] Final payload:', updatePayload);
    
    // Try the update with detailed error handling
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updatePayload)
      .eq('id', id)
      .select('id, animal_ids, title, user_id')
      .single();

    console.log('📤 [UPDATE DEBUG] Update response data:', data);
    console.log('📤 [UPDATE DEBUG] Update response error:', error);

    if (error) {
      console.error('❌ [UPDATE SERVICE] Database update failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Provide more specific error messages
      if (error.code === 'PGRST116') {
        throw new Error('No se encontró el evento para actualizar');
      } else if (error.code === '42501' || error.message.includes('permission')) {
        throw new Error('Sin permisos para actualizar este evento');
      } else if (error.code === 'PGRST301') {
        throw new Error('Datos de actualización inválidos');
      } else {
        throw new Error(`No se pudo actualizar el evento: ${error.message}`);
      }
    }

    if (!data) {
      console.error('❌ [UPDATE SERVICE] No data returned from update');
      throw new Error('No se pudo verificar la actualización del evento');
    }

    console.log('✅ [UPDATE SERVICE] Update successful:', data);
    
    // Verify the animal IDs were saved correctly
    if (updatedData.animalIds !== undefined) {
      console.log('🔍 [VERIFICATION] Expected animal_ids:', updatePayload.animal_ids);
      console.log('🔍 [VERIFICATION] Actual animal_ids in response:', data.animal_ids);
    }

    // Update event notifications
    // First, delete existing notifications
    await supabase
      .from('event_notifications')
      .delete()
      .eq('event_id', id);

    // Then, add new notifications for selected users
    if (selectedUserIds.length > 0) {
      const notifications = selectedUserIds.map(userId => ({
        event_id: id,
        user_id: userId
      }));

      const { error: notificationError } = await supabase
        .from('event_notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('⚠️ [UPDATE SERVICE] Notification update failed (non-critical):', notificationError);
      } else {
        console.log('✅ [UPDATE SERVICE] Notifications updated successfully');
      }
    }

    return true;

  } catch (error: any) {
    console.error('💥 [UPDATE SERVICE] Caught exception:', error);
    throw error;
  }
};

export const deleteCalendarEvent = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }

  return true;
};
