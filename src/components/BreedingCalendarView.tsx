
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { BreedingRecord } from '@/services/breedingService';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface BreedingCalendarViewProps {
  records: BreedingRecord[];
  animalNames: Record<string, string>;
}

const BreedingCalendarView: React.FC<BreedingCalendarViewProps> = ({ records, animalNames }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Transform breeding records into events format for EnhancedCalendar
  const calendarEvents = records.flatMap(record => {
    const events = [];
    
    // Breeding event
    events.push({
      eventDate: record.breedingDate,
      title: `Apareamiento - ${animalNames[record.motherId]} × ${animalNames[record.fatherId]}`,
      eventType: 'breeding'
    });
    
    // Expected due date event
    if (record.expectedDueDate) {
      events.push({
        eventDate: record.expectedDueDate,
        title: `Parto Esperado - ${animalNames[record.motherId]}`,
        eventType: 'expected'
      });
    }
    
    // Actual birth date event
    if (record.actualBirthDate) {
      events.push({
        eventDate: record.actualBirthDate,
        title: `Parto - ${animalNames[record.motherId]}`,
        eventType: 'birth'
      });
    }
    
    return events;
  });

  const getRecordsForDate = (date: Date) => {
    return records.filter(record => {
      const breedingDate = new Date(record.breedingDate);
      const expectedDueDate = record.expectedDueDate ? new Date(record.expectedDueDate) : null;
      const actualBirthDate = record.actualBirthDate ? new Date(record.actualBirthDate) : null;
      
      return (
        isSameDay(breedingDate, date) ||
        (expectedDueDate && isSameDay(expectedDueDate, date)) ||
        (actualBirthDate && isSameDay(actualBirthDate, date))
      );
    });
  };

  const getEventType = (record: BreedingRecord, date: Date) => {
    const breedingDate = new Date(record.breedingDate);
    const expectedDueDate = record.expectedDueDate ? new Date(record.expectedDueDate) : null;
    const actualBirthDate = record.actualBirthDate ? new Date(record.actualBirthDate) : null;

    if (isSameDay(breedingDate, date)) return 'breeding';
    if (expectedDueDate && isSameDay(expectedDueDate, date)) return 'expected';
    if (actualBirthDate && isSameDay(actualBirthDate, date)) return 'birth';
    return 'other';
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'breeding':
        return 'bg-blue-100 text-blue-800';
      case 'expected':
        return 'bg-yellow-100 text-yellow-800';
      case 'birth':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'breeding':
        return 'Apareamiento';
      case 'expected':
        return 'Parto Esperado';
      case 'birth':
        return 'Parto';
      default:
        return 'Evento';
    }
  };


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
                onSelect={setSelectedDate}
                className="rounded-md border w-full max-w-md mx-auto"
                showNavigationHeader={true}
                events={calendarEvents}
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
            <div className="space-y-2">
              {selectedDate && getRecordsForDate(selectedDate).length > 0 ? (
                getRecordsForDate(selectedDate).map(record => {
                  const eventTypes = [];
                  const breedingDate = new Date(record.breedingDate);
                  const expectedDueDate = record.expectedDueDate ? new Date(record.expectedDueDate) : null;
                  const actualBirthDate = record.actualBirthDate ? new Date(record.actualBirthDate) : null;
                  
                  if (isSameDay(breedingDate, selectedDate)) eventTypes.push('breeding');
                  if (expectedDueDate && isSameDay(expectedDueDate, selectedDate)) eventTypes.push('expected');
                  if (actualBirthDate && isSameDay(actualBirthDate, selectedDate)) eventTypes.push('birth');
                  
                  return eventTypes.map(eventType => (
                    <div key={`${record.id}-${eventType}`} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getEventColor(eventType)} variant="secondary">
                          {getEventLabel(eventType)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {animalNames[record.motherId]} × {animalNames[record.fatherId]}
                      </div>
                      {eventType === 'birth' && record.offspringCount && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {record.offspringCount} crías
                        </div>
                      )}
                    </div>
                  ));
                })
              ) : (
                <p className="text-sm text-muted-foreground">No hay eventos para esta fecha</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="mt-4 lg:mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Historial de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800">Apareamiento</Badge>
                <span className="text-sm text-gray-600">Fecha de apareamiento</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-yellow-100 text-yellow-800">Parto Esperado</Badge>
                <span className="text-sm text-gray-600">Fecha esperada de parto</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">Parto</Badge>
                <span className="text-sm text-gray-600">Fecha real de parto</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default BreedingCalendarView;
