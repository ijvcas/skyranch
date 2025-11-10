
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTimezone } from '@/hooks/useTimezone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, MapPin, DollarSign, User, Clock, Bell } from 'lucide-react';
import { CalendarEvent } from '@/services/calendarService';

interface Animal {
  id: string;
  name: string;
}

interface EventDetailDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  animals: Animal[];
}

const EventDetailDialog = ({ 
  event, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  animals 
}: EventDetailDialogProps) => {
  const { t, i18n } = useTranslation();
  const { formatCurrency } = useTimezone();
  
  if (!event) return null;

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
    return t(`calendar:eventTypes.${type}`) || type;
  };

  const formatEventDateTime = (eventDate: string, endDate?: string, allDay?: boolean) => {
    const startDate = new Date(eventDate);
    const locale = i18n.language === 'es' ? 'es-ES' : i18n.language === 'pt' ? 'pt-PT' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    
    if (allDay) {
      return startDate.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) + ` (${t('calendar:form.allDay')})`;
    }

    let timeString = startDate.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const atText = i18n.language === 'es' ? 'a las' : i18n.language === 'pt' ? 'às' : i18n.language === 'fr' ? 'à' : 'at';
    timeString += ` ${atText} ` + startDate.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (endDate) {
      const endDateTime = new Date(endDate);
      timeString += ' - ' + endDateTime.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return timeString;
  };

  const getReminderText = (minutes: number) => {
    if (minutes === 0) return t('calendar:reminders.none');
    if (minutes === 15) return t('calendar:reminders.15min');
    if (minutes === 30) return t('calendar:reminders.30min');
    if (minutes === 60) return t('calendar:reminders.1hour');
    if (minutes === 120) return t('calendar:reminders.2hours');
    if (minutes === 1440) return t('calendar:reminders.1day');
    if (minutes === 2880) return t('calendar:reminders.2days');
    if (minutes === 10080) return t('calendar:reminders.1week');
    
    // Fallback for custom values
    if (minutes < 60) return `${minutes} ${i18n.language === 'es' ? 'minutos antes' : i18n.language === 'pt' ? 'minutos antes' : i18n.language === 'fr' ? 'minutes avant' : 'minutes before'}`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} ${i18n.language === 'es' ? 'horas antes' : i18n.language === 'pt' ? 'horas antes' : i18n.language === 'fr' ? 'heures avant' : 'hours before'}`;
    return `${Math.floor(minutes / 1440)} ${i18n.language === 'es' ? 'días antes' : i18n.language === 'pt' ? 'dias antes' : i18n.language === 'fr' ? 'jours avant' : 'days before'}`;
  };

  const handleDelete = () => {
    if (window.confirm(t('calendar:confirmDelete'))) {
      onDelete(event.id);
      onClose();
    }
  };

  // Get animals for this event (support both old animalId and new animalIds)
  const eventAnimals = React.useMemo(() => {
    const animalIds = event.animalIds && event.animalIds.length > 0 
      ? event.animalIds 
      : (event.animalId ? [event.animalId] : []);
    
    console.log('🐄 [EVENT DETAIL] Event animals data:', { 
      eventAnimalIds: event.animalIds, 
      eventAnimalId: event.animalId, 
      calculatedIds: animalIds,
      availableAnimals: animals.length 
    });
    
    return animals.filter(animal => animalIds.includes(animal.id));
  }, [event.animalIds, event.animalId, animals]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <span>{event.title}</span>
              {event.createdByName && (
                <p className="text-sm font-normal text-gray-500 mt-1">
                  {t('calendar:detail.createdBy')}: {event.createdByName}
                </p>
              )}
            </div>
            <Badge className={getEventTypeColor(event.eventType)}>
              {getEventTypeLabel(event.eventType)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Details */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {formatEventDateTime(event.eventDate, event.endDate, event.allDay)}
              </span>
            </div>

            {event.reminderMinutes > 0 && (
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {t('calendar:form.reminder')}: {getReminderText(event.reminderMinutes)}
                </span>
              </div>
            )}

            {eventAnimals.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {t('calendar:detail.animals')} ({eventAnimals.length}):
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 ml-6">
                  {eventAnimals.map(animal => (
                    <Badge key={animal.id} variant="outline" className="text-xs">
                      {animal.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{event.location}</span>
              </div>
            )}

            {event.veterinarian && (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{t('calendar:veterinarian')}: {event.veterinarian}</span>
              </div>
            )}

            {event.cost && (
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{t('calendar:cost')}: {formatCurrency(event.cost)}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h4 className="font-medium mb-2">{t('calendar:detail.description')}</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {event.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div>
              <h4 className="font-medium mb-2">{t('calendar:detail.notes')}</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {event.notes}
              </p>
            </div>
          )}

          {/* Status and Event Properties */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={event.status === 'completed' ? 'default' : 'secondary'}>
              {t('calendar:detail.status')}: {t(`calendar:status.${event.status || 'scheduled'}`)}
            </Badge>
            {event.allDay && (
              <Badge variant="outline">{t('calendar:form.allDay')}</Badge>
            )}
            {event.recurring && (
              <Badge variant="outline">{t('calendar:detail.recurring')}</Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {t('calendar:detail.close')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onEdit(event);
                onClose();
              }}
              className="flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>{t('calendar:actions.edit')}</span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('calendar:actions.delete')}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailDialog;
