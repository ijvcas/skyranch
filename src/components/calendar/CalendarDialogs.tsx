
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAnimals } from '@/services/animalService';
import EventEditDialog from '@/components/calendar/EventEditDialog';
import EventDetailDialog from '@/components/calendar/EventDetailDialog';
import { CalendarEvent } from '@/services/calendarService';

interface CalendarDialogsProps {
  selectedEventForEdit: CalendarEvent | null;
  selectedEventForDetail: CalendarEvent | null;
  isEditDialogOpen: boolean;
  isDetailDialogOpen: boolean;
  selectedUserIds: string[];
  onUserSelectionChange: (userIds: string[]) => void;
  onCloseEditDialog: () => void;
  onCloseDetailDialog: () => void;
  onSaveEditedEvent: (eventData: Partial<CalendarEvent>, selectedUserIds: string[]) => void;
  onDeleteEvent: (eventId: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

const CalendarDialogs = ({
  selectedEventForEdit,
  selectedEventForDetail,
  isEditDialogOpen,
  isDetailDialogOpen,
  selectedUserIds,
  onUserSelectionChange,
  onCloseEditDialog,
  onCloseDetailDialog,
  onSaveEditedEvent,
  onDeleteEvent,
  onEditEvent
}: CalendarDialogsProps) => {
  const { data: animals = [] } = useQuery({
    queryKey: ['animals'],
    queryFn: () => getAllAnimals(false)
  });

  return (
    <>
      {/* Event Detail Dialog */}
      <EventDetailDialog
        event={selectedEventForDetail}
        isOpen={isDetailDialogOpen}
        onClose={onCloseDetailDialog}
        onEdit={onEditEvent}
        onDelete={onDeleteEvent}
        animals={animals}
      />

      {/* Event Edit Dialog */}
      <EventEditDialog
        event={selectedEventForEdit}
        isOpen={isEditDialogOpen}
        onClose={onCloseEditDialog}
        onSave={onSaveEditedEvent}
        onDelete={onDeleteEvent}
        selectedUserIds={selectedUserIds}
        onUserSelectionChange={onUserSelectionChange}
      />
    </>
  );
};

export default CalendarDialogs;
