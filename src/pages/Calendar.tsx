
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useCalendarState } from '@/hooks/useCalendarState';
import { CalendarEvent } from '@/services/calendarService';
import { checkPermission } from '@/services/permissionService';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarContent from '@/components/calendar/CalendarContent';
import CalendarDialogs from '@/components/calendar/CalendarDialogs';
import PermissionGuard from '@/components/PermissionGuard';

const CalendarPage = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const {
    selectedDate,
    setSelectedDate,
    isDialogOpen,
    isEditDialogOpen,
    isDetailDialogOpen,
    selectedEventForEdit,
    selectedEventForDetail,
    selectedUserIds,
    setSelectedUserIds,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDetailDialog,
    closeDetailDialog
  } = useCalendarState();

  const { events, createEvent, updateEvent, deleteEvent, getNotificationUsers, isSubmitting } = useCalendarEvents();

  // Handle event query parameter from dashboard navigation
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        openDetailDialog(event);
        // Clear the query parameter
        setSearchParams({});
      }
    }
  }, [searchParams, events, openDetailDialog, setSearchParams]);

  const handleCreateEvent = async (eventData: any, selectedUserIds: string[]) => {
    console.log('📅 Creating event with selected users:', selectedUserIds);
    try {
      await checkPermission('calendar_manage');
      await createEvent(eventData, selectedUserIds);
      // Update badge count after event creation
      const { mobilePushService } = await import('@/services/mobile/pushNotificationService');
      await mobilePushService.updateBadgeCount();
      closeCreateDialog();
    } catch (error: any) {
      console.error('📅 Error creating event:', error);
      toast({
        title: "Error",
        description: error.message || "Error al crear el evento",
        variant: "destructive"
      });
    }
  };

  const handleEditEvent = async (event: CalendarEvent) => {
    console.log('📅 Editing event:', event.title);
    try {
      await checkPermission('calendar_manage');
      const notificationUsers = await getNotificationUsers(event.id);
      console.log('📅 Loaded notification users for event:', notificationUsers);
      openEditDialog(event, notificationUsers);
    } catch (error: any) {
      console.error('📅 Error loading event for edit:', error);
      toast({
        title: "Error",
        description: error.message || "Error al cargar el evento",
        variant: "destructive"
      });
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    console.log('📅 Event clicked:', event.title);
    openDetailDialog(event);
  };

  const handleSaveEditedEvent = async (eventData: Partial<CalendarEvent>, selectedUserIds: string[]) => {
    if (!selectedEventForEdit) return;
    console.log('📅 Saving edited event with selected users:', selectedUserIds);
    try {
      await checkPermission('calendar_manage');
      await updateEvent(selectedEventForEdit.id, eventData, selectedUserIds);
      closeEditDialog();
    } catch (error: any) {
      console.error('📅 Error updating event:', error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el evento",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    console.log('📅 Deleting event:', eventId);
    try {
      await checkPermission('calendar_manage');
      await deleteEvent(eventId);
      // Update badge count after event deletion
      const { mobilePushService } = await import('@/services/mobile/pushNotificationService');
      await mobilePushService.updateBadgeCount();
      closeEditDialog();
      closeDetailDialog();
    } catch (error: any) {
      console.error('📅 Error deleting event:', error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el evento",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden p-2 sm:p-4 pb-20 sm:pb-24">
      <div className="absolute inset-0 opacity-5">
        <img 
          src="/lovable-uploads/953e2699-9daf-4fea-86c8-e505a1e54eb3.png" 
          alt="SkyRanch watermark"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <CalendarHeader
          selectedDate={selectedDate}
          selectedUserIds={selectedUserIds}
          onUserSelectionChange={setSelectedUserIds}
          onSubmit={handleCreateEvent}
          isSubmitting={isSubmitting}
          isDialogOpen={isDialogOpen}
          onOpenDialog={openCreateDialog}
          onCloseDialog={closeCreateDialog}
        />

        <CalendarContent
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          events={events}
          onEditEvent={handleEditEvent}
          onEventClick={handleEventClick}
        />

        <CalendarDialogs
          selectedEventForEdit={selectedEventForEdit}
          selectedEventForDetail={selectedEventForDetail}
          isEditDialogOpen={isEditDialogOpen}
          isDetailDialogOpen={isDetailDialogOpen}
          selectedUserIds={selectedUserIds}
          onUserSelectionChange={setSelectedUserIds}
          onCloseEditDialog={closeEditDialog}
          onCloseDetailDialog={closeDetailDialog}
          onSaveEditedEvent={handleSaveEditedEvent}
          onDeleteEvent={handleDeleteEvent}
          onEditEvent={handleEditEvent}
        />
      </div>
    </div>
  );
};

// Wrap the calendar page with PermissionGuard
const WrappedCalendarPage = () => (
  <PermissionGuard permission="calendar_manage">
    <CalendarPage />
  </PermissionGuard>
);

export default WrappedCalendarPage;
