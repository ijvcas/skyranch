
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarEvent } from '@/services/calendarService';
import { getAllAnimals } from '@/services/animalService';
import { useQuery } from '@tanstack/react-query';
import UserSelector from '@/components/notifications/UserSelector';
import AnimalMultiSelect from './AnimalMultiSelect';

interface EventEditDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Partial<CalendarEvent>, selectedUserIds: string[]) => void;
  onDelete: (eventId: string) => void;
  selectedUserIds: string[];
  onUserSelectionChange: (userIds: string[]) => void;
}

const EventEditDialog = ({ 
  event, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  selectedUserIds, 
  onUserSelectionChange 
}: EventEditDialogProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedEvent, setEditedEvent] = useState({
    title: '',
    description: '',
    eventType: 'appointment' as CalendarEvent['eventType'],
    animalIds: [] as string[],
    eventDate: '',
    startTime: '09:00',
    endTime: '',
    allDay: false,
    reminderMinutes: 60,
    veterinarian: '',
    location: '',
    cost: '',
    notes: ''
  });

  const { data: animals = [] } = useQuery({
    queryKey: ['animals'],
    queryFn: () => getAllAnimals(false)
  });

  useEffect(() => {
    if (event) {
      const eventDate = new Date(event.eventDate);
      const eventDateOnly = eventDate.toISOString().split('T')[0];
      
      let startTime = '09:00';
      let endTime = '';
      
      if (!event.allDay) {
        startTime = eventDate.toTimeString().slice(0, 5);
        if (event.endDate) {
          const endDate = new Date(event.endDate);
          endTime = endDate.toTimeString().slice(0, 5);
        }
      }

      // Handle backward compatibility for single animalId and new animalIds array
      const animalIds = event.animalIds || (event.animalId ? [event.animalId] : []);
      
      setEditedEvent({
        title: event.title,
        description: event.description || '',
        eventType: event.eventType,
        animalIds: animalIds,
        eventDate: eventDateOnly,
        startTime: startTime,
        endTime: endTime,
        allDay: event.allDay || false,
        reminderMinutes: event.reminderMinutes || 60,
        veterinarian: event.veterinarian || '',
        location: event.location || '',
        cost: event.cost ? event.cost.toString() : '',
        notes: event.notes || ''
      });
    }
  }, [event]);

  const handleSave = async () => {
    if (!event || !editedEvent.title || isSubmitting) return;

    setIsSubmitting(true);
    
    // Combine date and time for the event
    let eventDateTime = new Date(editedEvent.eventDate);
    let endDateTime = null;

    if (!editedEvent.allDay && editedEvent.startTime) {
      const [hours, minutes] = editedEvent.startTime.split(':').map(Number);
      eventDateTime.setHours(hours, minutes, 0, 0);
    }

    if (!editedEvent.allDay && editedEvent.endTime) {
      const [endHours, endMinutes] = editedEvent.endTime.split(':').map(Number);
      endDateTime = new Date(editedEvent.eventDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
    }

    const eventData = {
      title: editedEvent.title,
      description: editedEvent.description,
      eventType: editedEvent.eventType,
      animalIds: editedEvent.animalIds, // Explicitly include animalIds
      eventDate: eventDateTime.toISOString(),
      endDate: endDateTime ? endDateTime.toISOString() : undefined,
      allDay: editedEvent.allDay,
      reminderMinutes: Number(editedEvent.reminderMinutes),
      veterinarian: editedEvent.veterinarian,
      location: editedEvent.location,
      cost: editedEvent.cost ? parseFloat(editedEvent.cost) : undefined,
      notes: editedEvent.notes
    };

    console.log('📅 [EDIT DIALOG] Saving event with animalIds:', eventData.animalIds);
    await onSave(eventData, selectedUserIds);
    setIsSubmitting(false);
  };

  const handleDelete = () => {
    if (!event || isSubmitting) return;
    onDelete(event.id);
  };

  const reminderOptions = [
    { value: 0, label: t('calendar:reminders.none') },
    { value: 15, label: t('calendar:reminders.15min') },
    { value: 30, label: t('calendar:reminders.30min') },
    { value: 60, label: t('calendar:reminders.1hour') },
    { value: 120, label: t('calendar:reminders.2hours') },
    { value: 1440, label: t('calendar:reminders.1day') },
    { value: 2880, label: t('calendar:reminders.2days') },
    { value: 10080, label: t('calendar:reminders.1week') }
  ];

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('calendar:dialog.edit')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Event Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t('calendar:form.title')} *</Label>
              <Input
                id="edit-title"
                value={editedEvent.title}
                onChange={(e) => setEditedEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('calendar:form.titlePlaceholder')}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">{t('calendar:form.date')} *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editedEvent.eventDate}
                  onChange={(e) => setEditedEvent(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('calendar:form.type')}</Label>
                <Select 
                  value={editedEvent.eventType} 
                  onValueChange={(value: CalendarEvent['eventType']) => 
                    setEditedEvent(prev => ({ ...prev, eventType: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vaccination">{t('calendar:eventTypes.vaccination')}</SelectItem>
                    <SelectItem value="checkup">{t('calendar:eventTypes.checkup')}</SelectItem>
                    <SelectItem value="breeding">{t('calendar:eventTypes.breeding')}</SelectItem>
                    <SelectItem value="treatment">{t('calendar:eventTypes.treatment')}</SelectItem>
                    <SelectItem value="feeding">{t('calendar:eventTypes.feeding')}</SelectItem>
                    <SelectItem value="appointment">{t('calendar:eventTypes.appointment')}</SelectItem>
                    <SelectItem value="reminder">{t('calendar:eventTypes.reminder')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time Settings */}
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-allDay"
                  checked={editedEvent.allDay}
                  onChange={(e) => setEditedEvent(prev => ({ ...prev, allDay: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-allDay">{t('calendar:form.allDay')}</Label>
              </div>

              {!editedEvent.allDay && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startTime">{t('calendar:form.startTime')}</Label>
                    <Input
                      id="edit-startTime"
                      type="time"
                      value={editedEvent.startTime}
                      onChange={(e) => setEditedEvent(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-endTime">{t('calendar:form.endTime')}</Label>
                    <Input
                      id="edit-endTime"
                      type="time"
                      value={editedEvent.endTime}
                      onChange={(e) => setEditedEvent(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Reminder Settings */}
            <div className="space-y-2">
              <Label>{t('calendar:form.reminder')}</Label>
              <Select 
                value={editedEvent.reminderMinutes.toString()} 
                onValueChange={(value) => setEditedEvent(prev => ({ ...prev, reminderMinutes: parseInt(value) }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar recordatorio" />
                </SelectTrigger>
                <SelectContent>
                  {reminderOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <AnimalMultiSelect
              animals={animals}
              selectedAnimalIds={editedEvent.animalIds}
              onChange={(selectedIds) => setEditedEvent(prev => ({ ...prev, animalIds: selectedIds }))}
              label={t('calendar:form.animals')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-veterinarian">{t('calendar:veterinarian')}</Label>
                <Input
                  id="edit-veterinarian"
                  value={editedEvent.veterinarian}
                  onChange={(e) => setEditedEvent(prev => ({ ...prev, veterinarian: e.target.value }))}
                  placeholder={t('calendar:veterinarianPlaceholder')}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cost">{t('calendar:cost')}</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  value={editedEvent.cost}
                  onChange={(e) => setEditedEvent(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder={t('calendar:costPlaceholder')}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">{t('calendar:location')}</Label>
              <Input
                id="edit-location"
                value={editedEvent.location}
                onChange={(e) => setEditedEvent(prev => ({ ...prev, location: e.target.value }))}
                placeholder={t('calendar:locationPlaceholder')}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('calendar:form.description')}</Label>
              <Textarea
                id="edit-description"
                value={editedEvent.description}
                onChange={(e) => setEditedEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('calendar:form.descriptionPlaceholder')}
                className="w-full"
              />
            </div>
          </div>

          {/* User Selector */}
          <UserSelector
            selectedUserIds={selectedUserIds}
            onUserSelectionChange={onUserSelectionChange}
          />
        </div>

        <div className="flex justify-between gap-2 mt-4">
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {t('calendar:actions.delete')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('calendar:actions.cancel')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSubmitting || !editedEvent.title}
            >
              {isSubmitting ? t('calendar:saving') : t('calendar:actions.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventEditDialog;
