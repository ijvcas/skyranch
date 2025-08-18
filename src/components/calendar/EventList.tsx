
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Bell, MapPin, DollarSign, Edit } from 'lucide-react';
import { CalendarEvent } from '@/services/calendarService';

interface EventListProps {
  events: CalendarEvent[];
  selectedDate: Date | undefined;
  onEditEvent: (event: CalendarEvent) => void;
}

const EventList = ({ events, selectedDate, onEditEvent }: EventListProps) => {
  const eventsForSelectedDate = events.filter(event => {
    if (!selectedDate) return false;
    
    // Fix timezone issues by comparing dates properly
    const eventDate = new Date(event.eventDate);
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const selectedDay = selectedDate.getDate();
    
    const eventYear = eventDate.getFullYear();
    const eventMonth = eventDate.getMonth();
    const eventDay = eventDate.getDate();
    
    return eventYear === selectedYear && 
           eventMonth === selectedMonth && 
           eventDay === selectedDay;
  });

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'vaccination':
        return 'bg-blue-100 text-blue-800';
      case 'checkup':
        return 'bg-green-100 text-green-800';
      case 'breeding':
        return 'bg-pink-100 text-pink-800';
      case 'treatment':
        return 'bg-red-100 text-red-800';
      case 'feeding':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'vaccination':
        return 'Vacunación';
      case 'checkup':
        return 'Revisión';
      case 'breeding':
        return 'Reproducción';
      case 'treatment':
        return 'Tratamiento';
      case 'feeding':
        return 'Alimentación';
      case 'appointment':
        return 'Cita';
      case 'reminder':
        return 'Recordatorio';
      default:
        return type;
    }
  };

  if (eventsForSelectedDate.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>No hay eventos para esta fecha</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {eventsForSelectedDate.map(event => (
        <div key={event.id} className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold">{event.title}</h4>
              {event.createdByName && (
                <p className="text-xs text-gray-500">Creado por: {event.createdByName}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getEventTypeColor(event.eventType)}>
                {getEventTypeLabel(event.eventType)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditEvent(event)}
                className="h-6 w-6 p-0"
              >
                <Edit className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {event.description && (
            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
          )}
          <div className="space-y-1 text-xs text-gray-500">
            {event.veterinarian && (
              <div className="flex items-center">
                <Bell className="w-3 h-3 mr-1" />
                {event.veterinarian}
              </div>
            )}
            {event.location && (
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {event.location}
              </div>
            )}
            {event.cost && (
              <div className="flex items-center">
                <DollarSign className="w-3 h-3 mr-1" />
                ${event.cost}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventList;
