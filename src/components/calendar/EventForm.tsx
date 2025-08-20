
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarEvent } from '@/services/calendarService';
import { getAllAnimals } from '@/services/animalService';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import UserSelector from '@/components/notifications/UserSelector';
import DatePickerField from './DatePickerField';
import EventTypeSelect from './EventTypeSelect';
import AnimalMultiSelect from './AnimalMultiSelect';

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

  const { data: animals = [] } = useQuery({
    queryKey: ['animals'],
    queryFn: getAllAnimals
  });

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
    { value: 0, label: 'Sin recordatorio' },
    { value: 15, label: '15 minutos antes' },
    { value: 30, label: '30 minutos antes' },
    { value: 60, label: '1 hora antes' },
    { value: 120, label: '2 horas antes' },
    { value: 1440, label: '1 día antes' },
    { value: 2880, label: '2 días antes' },
    { value: 10080, label: '1 semana antes' }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={newEvent.title}
            onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Título del evento"
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePickerField
            value={newEvent.eventDate}
            onChange={(date) => setNewEvent(prev => ({ ...prev, eventDate: date }))}
            label="Fecha"
            required
          />

          <EventTypeSelect
            value={newEvent.eventType}
            onChange={(value) => setNewEvent(prev => ({ ...prev, eventType: value }))}
            label="Tipo de Evento"
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
            <Label htmlFor="allDay">Todo el día</Label>
          </div>

          {!newEvent.allDay && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Hora de inicio</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Hora de fin (opcional)</Label>
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
          <Label>Recordatorio</Label>
          <Select 
            value={newEvent.reminderMinutes.toString()} 
            onValueChange={(value) => setNewEvent(prev => ({ ...prev, reminderMinutes: parseInt(value) }))}
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
          selectedAnimalIds={newEvent.animalIds}
          onChange={(selectedIds) => setNewEvent(prev => ({ ...prev, animalIds: selectedIds }))}
          label="Animales (Opcional)"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="veterinarian">Veterinario</Label>
            <Input
              id="veterinarian"
              value={newEvent.veterinarian}
              onChange={(e) => setNewEvent(prev => ({ ...prev, veterinarian: e.target.value }))}
              placeholder="Nombre del veterinario"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Costo</Label>
            <Input
              id="cost"
              type="number"
              value={newEvent.cost}
              onChange={(e) => setNewEvent(prev => ({ ...prev, cost: e.target.value }))}
              placeholder="0.00"
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Input
            id="location"
            value={newEvent.location}
            onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Ubicación del evento"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={newEvent.description}
            onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detalles adicionales"
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
        {isSubmitting ? 'Creando...' : 'Crear Evento'}
      </Button>
    </div>
  );
};

export default EventForm;
