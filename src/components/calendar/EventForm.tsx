
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarEvent } from '@/services/calendarService';
import { getAnimalNamesMap } from '@/services/animal/animalQueries';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import UserSelector from '@/components/notifications/UserSelector';
import DatePickerField from './DatePickerField';
import EventTypeSelect from './EventTypeSelect';
import AnimalMultiSelect from './AnimalMultiSelect';
import { useTranslation } from 'react-i18next';

interface EventFormProps {
  selectedDate: Date | undefined;
  selectedUserIds: string[];
  onUserSelectionChange: (userIds: string[]) => void;
  onSubmit: (eventData: any, selectedUserIds: string[]) => void;
  isSubmitting: boolean;
}

const EventForm = ({ 
  selectedDate, 
  selectedUserIds, 
  onUserSelectionChange, 
  onSubmit, 
  isSubmitting 
}: EventFormProps) => {
  const { t } = useTranslation('calendar');
  
  const [newEvent, setNewEvent] = useState({
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

  // OPTIMIZED: Only fetch animal names
  const { data: animalNames = {} } = useQuery({
    queryKey: ['animals', 'names-map'],
    queryFn: () => getAnimalNamesMap(false),
    staleTime: 10 * 60_000,
  });

  // Convert to array format for AnimalMultiSelect
  const animals = Object.entries(animalNames).map(([id, name]) => ({ id, name }));

  // Set today's date when component mounts or selectedDate changes
  useEffect(() => {
    const dateToUse = selectedDate || new Date();
    const formattedDate = format(dateToUse, 'yyyy-MM-dd');
    setNewEvent(prev => ({
      ...prev,
      eventDate: formattedDate
    }));
  }, [selectedDate]);

  const handleSubmit = () => {
    if (!newEvent.title || !newEvent.eventDate || isSubmitting) return;

    // Combine date and time for the event
    let eventDateTime = new Date(newEvent.eventDate);
    let endDateTime = null;

    if (!newEvent.allDay && newEvent.startTime) {
      const [hours, minutes] = newEvent.startTime.split(':').map(Number);
      eventDateTime.setHours(hours, minutes, 0, 0);
    }

    if (!newEvent.allDay && newEvent.endTime) {
      const [endHours, endMinutes] = newEvent.endTime.split(':').map(Number);
      endDateTime = new Date(newEvent.eventDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
    }

    const eventData = {
      ...newEvent,
      eventDate: eventDateTime.toISOString(),
      endDate: endDateTime ? endDateTime.toISOString() : undefined,
      status: 'scheduled' as const,
      allDay: newEvent.allDay,
      recurring: false,
      reminderMinutes: Number(newEvent.reminderMinutes),
      cost: newEvent.cost ? parseFloat(newEvent.cost) : undefined
    };

    onSubmit(eventData, selectedUserIds);
    
    // Reset form
    const today = format(new Date(), 'yyyy-MM-dd');
    setNewEvent({
      title: '',
      description: '',
      eventType: 'appointment',
      animalIds: [],
      eventDate: today,
      startTime: '09:00',
      endTime: '',
      allDay: false,
      reminderMinutes: 60,
      veterinarian: '',
      location: '',
      cost: '',
      notes: ''
    });
  };

  const reminderOptions = [
    { value: 0, label: t('reminders.none') },
    { value: 15, label: t('reminders.15min') },
    { value: 30, label: t('reminders.30min') },
    { value: 60, label: t('reminders.1hour') },
    { value: 120, label: t('reminders.2hours') },
    { value: 1440, label: t('reminders.1day') },
    { value: 2880, label: t('reminders.2days') },
    { value: 10080, label: t('reminders.1week') }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">{t('form.title')} *</Label>
          <Input
            id="title"
            value={newEvent.title}
            onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
            placeholder={t('form.titlePlaceholder')}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePickerField
            value={newEvent.eventDate}
            onChange={(date) => setNewEvent(prev => ({ ...prev, eventDate: date }))}
            label={t('form.date')}
            required
          />

          <EventTypeSelect
            value={newEvent.eventType}
            onChange={(value) => setNewEvent(prev => ({ ...prev, eventType: value }))}
            label={t('form.type')}
          />
        </div>

        {/* Time Settings */}
        <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allDay"
              checked={newEvent.allDay}
              onChange={(e) => setNewEvent(prev => ({ ...prev, allDay: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="allDay">{t('form.allDay')}</Label>
          </div>

          {!newEvent.allDay && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">{t('form.startTime')}</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">{t('form.endTime')}</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Reminder Settings */}
        <div className="space-y-2">
          <Label>{t('form.reminder')}</Label>
          <Select 
            value={newEvent.reminderMinutes.toString()} 
            onValueChange={(value) => setNewEvent(prev => ({ ...prev, reminderMinutes: parseInt(value) }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('form.reminder')} />
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
          selectedAnimalIds={newEvent.animalIds}
          onChange={(selectedIds) => setNewEvent(prev => ({ ...prev, animalIds: selectedIds }))}
          label={t('form.animals')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="veterinarian">{t('veterinarian')}</Label>
            <Input
              id="veterinarian"
              value={newEvent.veterinarian}
              onChange={(e) => setNewEvent(prev => ({ ...prev, veterinarian: e.target.value }))}
              placeholder={t('veterinarianPlaceholder')}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">{t('cost')}</Label>
            <Input
              id="cost"
              type="number"
              value={newEvent.cost}
              onChange={(e) => setNewEvent(prev => ({ ...prev, cost: e.target.value }))}
              placeholder={t('costPlaceholder')}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">{t('location')}</Label>
          <Input
            id="location"
            value={newEvent.location}
            onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
            placeholder={t('locationPlaceholder')}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('form.description')}</Label>
          <Textarea
            id="description"
            value={newEvent.description}
            onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
            placeholder={t('form.descriptionPlaceholder')}
            className="w-full"
          />
        </div>
      </div>

      <UserSelector
        selectedUserIds={selectedUserIds}
        onUserSelectionChange={onUserSelectionChange}
      />

      <Button 
        onClick={handleSubmit} 
        className="w-full"
        disabled={isSubmitting || !newEvent.title || !newEvent.eventDate}
      >
        {isSubmitting ? t('creating') : t('actions.create')}
      </Button>
    </div>
  );
};

export default EventForm;
