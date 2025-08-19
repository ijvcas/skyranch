import { supabase } from '@/integrations/supabase/client';

// Calendar Event interface
export interface CalendarEvent {
  id: string;
  user_id: string;
  animal_id?: string;
  event_date: string;
  end_date?: string;
  all_day?: boolean;
  recurring?: boolean;
  reminder_minutes?: number;
  cost?: number;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string;
  event_type: string;
  recurrence_pattern?: string;
  status?: string;
  veterinarian?: string;
  location?: string;
  notes?: string;
  animal_ids?: string[];
}

// Enhanced calendar service with all required exports
export const getAllEvents = async (): Promise<CalendarEvent[]> => {
  try {
    console.log('📅 CALENDAR_SERVICE: Fetching all calendar events...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ CALENDAR_SERVICE: No authenticated user');
      return [];
    }

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Calendar query timeout')), 10000)
    );

    const queryPromise = supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true });

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.error('❌ CALENDAR_SERVICE: Query error:', error);
      return [];
    }

    console.log('✅ CALENDAR_SERVICE: Events fetched:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ CALENDAR_SERVICE: Exception:', error);
    return [];
  }
};

export const getEventsByDateRange = async (startDate: string, endDate: string): Promise<CalendarEvent[]> => {
  try {
    console.log('📅 CALENDAR_SERVICE: Fetching events in range:', startDate, 'to', endDate);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ CALENDAR_SERVICE: No authenticated user');
      return [];
    }

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Calendar range query timeout')), 10000)
    );

    const queryPromise = supabase
      .from('calendar_events')
      .select('*')
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true });

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.error('❌ CALENDAR_SERVICE: Range query error:', error);
      return [];
    }

    console.log('✅ CALENDAR_SERVICE: Range events fetched:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ CALENDAR_SERVICE: Range exception:', error);
    return [];
  }
};

// Additional required functions for compatibility
export const getCalendarEvents = getAllEvents;

export const addCalendarEvent = async (eventData: Partial<CalendarEvent>, selectedUserIds?: string[]): Promise<string | null> => {
  try {
    console.log('📅 CALENDAR_SERVICE: Adding calendar event...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ CALENDAR_SERVICE: No authenticated user');
      return null;
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert([{ 
        title: eventData.title || 'Nuevo Evento',
        event_type: eventData.event_type || 'general',
        event_date: eventData.event_date || new Date().toISOString(),
        user_id: user.id,
        ...eventData 
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ CALENDAR_SERVICE: Add event error:', error);
      return null;
    }

    console.log('✅ CALENDAR_SERVICE: Event added successfully');
    return data.id;
  } catch (error) {
    console.error('❌ CALENDAR_SERVICE: Add event exception:', error);
    return null;
  }
};

export const updateCalendarEvent = async (id: string, eventData: Partial<CalendarEvent>, selectedUserIds?: string[]): Promise<boolean> => {
  try {
    console.log('📅 CALENDAR_SERVICE: Updating calendar event:', id);
    
    const { data, error } = await supabase
      .from('calendar_events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ CALENDAR_SERVICE: Update event error:', error);
      return null;
    }

    console.log('✅ CALENDAR_SERVICE: Event updated successfully');
    return true;
  } catch (error) {
    console.error('❌ CALENDAR_SERVICE: Update event exception:', error);
    return null;
  }
};

export const deleteCalendarEvent = async (id: string): Promise<boolean> => {
  try {
    console.log('📅 CALENDAR_SERVICE: Deleting calendar event:', id);
    
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ CALENDAR_SERVICE: Delete event error:', error);
      return false;
    }

    console.log('✅ CALENDAR_SERVICE: Event deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ CALENDAR_SERVICE: Delete event exception:', error);
    return false;
  }
};

export const getEventNotificationUsers = async (eventId: string): Promise<string[]> => {
  try {
    console.log('📅 CALENDAR_SERVICE: Getting notification users for event:', eventId);
    
    const { data, error } = await supabase
      .from('event_notifications')
      .select('user_id')
      .eq('event_id', eventId);

    if (error) {
      console.error('❌ CALENDAR_SERVICE: Get notification users error:', error);
      return [];
    }

    return data?.map(n => n.user_id) || [];
  } catch (error) {
    console.error('❌ CALENDAR_SERVICE: Get notification users exception:', error);
    return [];
  }
};