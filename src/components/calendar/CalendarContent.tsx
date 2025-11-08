
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAnimalNamesMap } from '@/services/animal/animalQueries';
import EventList from '@/components/calendar/EventList';
import UpcomingEvents from '@/components/calendar/UpcomingEvents';
import { CalendarEvent } from '@/services/calendarService';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { es, pt, fr, enUS } from 'date-fns/locale';

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
  const { t, i18n } = useTranslation('calendar');
  
  // Date locale mapping
  const dateLocales = {
    es,
    pt,
    fr,
    en: enUS
  };
  
  const currentLocale = dateLocales[i18n.language as keyof typeof dateLocales] || enUS;
  
  // OPTIMIZED: Only fetch animal names for display
  const { data: animalNames = {} } = useQuery({
    queryKey: ['animals', 'names-map'],
    queryFn: () => getAnimalNamesMap(false),
    staleTime: 10 * 60_000, // 10 minutes - rarely changes
    gcTime: 15 * 60_000,
  });

  // Convert names map to array format for UpcomingEvents component
  const animals = Object.entries(animalNames).map(([id, name]) => ({ id, name }));

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardContent className="p-3 sm:p-6 pt-6">
            <div className="flex justify-center">
              <EnhancedCalendar
                mode="single"
                selected={selectedDate}
                onSelect={onSelectDate}
                className="rounded-md border w-full max-w-md mx-auto"
                showNavigationHeader={true}
                events={events.map(event => ({
                  eventDate: event.eventDate,
                  title: event.title,
                  eventType: event.eventType
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">
              {t('eventsFor', { 
                date: selectedDate ? format(selectedDate, 'EEE, MMM d', { locale: currentLocale }) : ''
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
