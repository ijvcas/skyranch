
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent } from '@/services/calendarService';

interface Animal {
  id: string;
  name: string;
}

interface UpcomingEventsProps {
  events: CalendarEvent[];
  animals: Animal[];
  onEventClick: (event: CalendarEvent) => void;
}

const UpcomingEvents = ({ events, animals, onEventClick }: UpcomingEventsProps) => {
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

  const upcomingEvents = events
    .filter(event => new Date(event.eventDate) >= new Date())
    .slice(0, 6);

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl">Próximos Eventos</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {upcomingEvents.map(event => (
            <div 
              key={event.id} 
              className="p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all duration-200"
              onClick={() => onEventClick(event)}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <h4 className="font-semibold text-xs sm:text-sm truncate flex-1">{event.title}</h4>
                <Badge className={`${getEventTypeColor(event.eventType)} text-xs flex-shrink-0`}>
                  {getEventTypeLabel(event.eventType)}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">
                {new Date(event.eventDate).toLocaleDateString('es-ES')}
              </p>
              {event.createdByName && (
                <p className="text-xs text-gray-500 mb-1">
                  Creado por: {event.createdByName}
                </p>
              )}
              {event.animalId && (
                <p className="text-xs text-gray-500 mb-2 truncate">
                  Animal: {animals.find(a => a.id === event.animalId)?.name || 'N/A'}
                </p>
              )}
              <div className="text-xs text-blue-600 hover:text-blue-800">
                Click para ver detalles →
              </div>
            </div>
          ))}
          {upcomingEvents.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">
              <p className="text-sm">No hay eventos próximos</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;
