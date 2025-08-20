
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarEvent } from '@/services/calendarService';

interface EventTypeSelectProps {
  value: CalendarEvent['eventType'];
  onChange: (value: CalendarEvent['eventType']) => void;
  label: string;
}

const EventTypeSelect = ({ value, onChange, label }: EventTypeSelectProps) => {
  const eventTypes = [
    { value: 'vaccination', label: 'Vacunación' },
    { value: 'checkup', label: 'Revisión' },
    { value: 'breeding', label: 'Reproducción' },
    { value: 'treatment', label: 'Tratamiento' },
    { value: 'feeding', label: 'Alimentación' },
    { value: 'appointment', label: 'Cita' },
    { value: 'reminder', label: 'Recordatorio' },
  ] as const;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar tipo de evento" />
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {eventTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default EventTypeSelect;
