import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { startOfWeek, endOfWeek, isWithinInterval, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const DashboardWeeklyEvents = () => {
  const navigate = useNavigate();
  const { events } = useCalendarEvents();

  // Filter events for current week
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const weeklyEvents = events.filter(event => {
    const eventDate = parseISO(event.eventDate);
    return isWithinInterval(eventDate, { start: currentWeekStart, end: currentWeekEnd });
  }).slice(0, 5); // Show max 5 events

  const getEventTypeColor = (eventType: string) => {
    const colors = {
      vaccination: 'bg-blue-500',
      checkup: 'bg-green-500', 
      breeding: 'bg-purple-500',
      feeding: 'bg-orange-500',
      treatment: 'bg-red-500',
      appointment: 'bg-indigo-500',
      reminder: 'bg-yellow-500'
    };
    return colors[eventType as keyof typeof colors] || 'bg-gray-500';
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/calendar?event=${eventId}`);
  };

  const handleViewAllEvents = () => {
    navigate('/calendar');
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-primary flex items-center justify-center shadow-md">
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-2xl font-semibold">
                Eventos de esta semana
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(currentWeekStart, 'd MMM', { locale: es })} - {format(currentWeekEnd, 'd MMM', { locale: es })}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-4 md:p-6">
        {weeklyEvents.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No hay eventos programados para esta semana</p>
            <button
              onClick={handleViewAllEvents}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Ver calendario completo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {weeklyEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors group"
              >
                <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.eventType)}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(event.eventDate), 'dd/MM HH:mm', { locale: es })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={handleViewAllEvents}
              className="w-full mt-4 text-primary hover:text-primary/80 font-medium text-sm transition-colors text-center"
            >
              Ver todos los eventos ({events.length})
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardWeeklyEvents;