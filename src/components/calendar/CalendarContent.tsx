
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAllAnimals } from '@/services/animalService';
import EventList from '@/components/calendar/EventList';
import UpcomingEvents from '@/components/calendar/UpcomingEvents';
import { CalendarEvent } from '@/services/calendarService';

interface CalendarContentProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  events: CalendarEvent[];
  onEditEvent: (event: CalendarEvent) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const CalendarContent = ({
  selectedDate,
  onSelectDate,
  events,
  onEditEvent,
  onEventClick
}: CalendarContentProps) => {
  const { data: animals = [] } = useQuery({
    queryKey: ['animals'],
    queryFn: getAllAnimals
  });

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Calendario
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="flex justify-center">
              <EnhancedCalendar
                mode="single"
                selected={selectedDate}
                onSelect={onSelectDate}
                className="rounded-md border w-full max-w-md mx-auto"
                showNavigationHeader={true}
                events={events.map(event => ({
                  eventDate: event.event_date,
                  title: event.title,
                  eventType: event.event_type
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">
              Eventos - {selectedDate?.toLocaleDateString('es-ES', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <EventList
              events={events}
              selectedDate={selectedDate}
              onEditEvent={onEditEvent}
            />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <div className="mt-4 lg:mt-6">
        <UpcomingEvents
          events={events}
          animals={animals}
          onEventClick={onEventClick}
        />
      </div>
    </>
  );
};

export default CalendarContent;
