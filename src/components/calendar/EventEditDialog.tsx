
import React, { useState, useEffect } from 'react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedEvent, setEditedEvent] = useState({
    title: '',
    description: '',
    eventType: 'appointment' as CalendarEvent['eventType'],
    animalId: '',
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

      setEditedEvent({
        title: event.title,
        description: event.description || '',
        eventType: event.eventType,
        animalId: event.animalId || '',
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
      ...editedEvent,
      eventDate: eventDateTime.toISOString(),
      endDate: endDateTime ? endDateTime.toISOString() : undefined,
      reminderMinutes: Number(editedEvent.reminderMinutes),
      cost: editedEvent.cost ? parseFloat(editedEvent.cost) : undefined
    };

    await onSave(eventData, selectedUserIds);
    setIsSubmitting(false);
  };

  const handleDelete = () => {
    if (!event || isSubmitting) return;
    onDelete(event.id);
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

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Event Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={editedEvent.title}
                onChange={(e) => setEditedEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título del evento"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Fecha *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editedEvent.eventDate}
                  onChange={(e) => setEditedEvent(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Evento</Label>
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
                    <SelectItem value="vaccination">Vacunación</SelectItem>
                    <SelectItem value="checkup">Revisión</SelectItem>
                    <SelectItem value="breeding">Reproducción</SelectItem>
                    <SelectItem value="treatment">Tratamiento</SelectItem>
                    <SelectItem value="feeding">Alimentación</SelectItem>
                    <SelectItem value="appointment">Cita</SelectItem>
                    <SelectItem value="reminder">Recordatorio</SelectItem>
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
                <Label htmlFor="edit-allDay">Todo el día</Label>
              </div>

              {!editedEvent.allDay && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startTime">Hora de inicio</Label>
                    <Input
                      id="edit-startTime"
                      type="time"
                      value={editedEvent.startTime}
                      onChange={(e) => setEditedEvent(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-endTime">Hora de fin (opcional)</Label>
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
              <Label>Recordatorio</Label>
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

            <div className="space-y-2">
              <Label>Animal (Opcional)</Label>
              <Select 
                value={editedEvent.animalId} 
                onValueChange={(value) => setEditedEvent(prev => ({ ...prev, animalId: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar animal" />
                </SelectTrigger>
                <SelectContent>
                  {animals.map(animal => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.name} (#{animal.tag})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-veterinarian">Veterinario</Label>
                <Input
                  id="edit-veterinarian"
                  value={editedEvent.veterinarian}
                  onChange={(e) => setEditedEvent(prev => ({ ...prev, veterinarian: e.target.value }))}
                  placeholder="Nombre del veterinario"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cost">Costo</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  value={editedEvent.cost}
                  onChange={(e) => setEditedEvent(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Ubicación</Label>
              <Input
                id="edit-location"
                value={editedEvent.location}
                onChange={(e) => setEditedEvent(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ubicación del evento"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={editedEvent.description}
                onChange={(e) => setEditedEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalles adicionales"
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
            Eliminar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSubmitting || !editedEvent.title}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventEditDialog;
