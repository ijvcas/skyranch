
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Baby, Heart, Clock, ChevronRight } from 'lucide-react';
import { BreedingRecord } from '@/services/breedingService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateActualGestationDuration } from '@/services/gestationService';

interface BreedingRecordsListProps {
  records: BreedingRecord[];
  animalNames: Record<string, string>;
  onRecordClick?: (record: BreedingRecord) => void;
  emptyMessage?: string;
}

const BreedingRecordsList: React.FC<BreedingRecordsListProps> = ({ 
  records, 
  animalNames,
  onRecordClick,
  emptyMessage = "No hay registros de apareamiento disponibles."
}) => {
  const getStatusLabel = (status: BreedingRecord['status']) => {
    const labels = {
      planned: 'Planeado',
      completed: 'Completado',
      confirmed_pregnant: 'Embarazo Confirmado',
      not_pregnant: 'No Embarazada',
      birth_completed: 'Parto Completado',
      failed: 'Fallido'
    };
    return labels[status];
  };

  const getStatusColor = (status: BreedingRecord['status']) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      confirmed_pregnant: 'bg-purple-100 text-purple-800',
      not_pregnant: 'bg-gray-100 text-gray-800',
      birth_completed: 'bg-emerald-100 text-emerald-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getMethodLabel = (method: BreedingRecord['breedingMethod']) => {
    const labels = {
      natural: 'Natural',
      artificial_insemination: 'Inseminación Artificial',
      embryo_transfer: 'Transferencia de Embriones'
    };
    return labels[method];
  };

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => {
        const gestationDuration = record.breedingDate && record.actualBirthDate 
          ? calculateActualGestationDuration(record.breedingDate, record.actualBirthDate)
          : null;

        return (
          <Card 
            key={record.id} 
            className="shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-gray-50"
            onClick={() => onRecordClick?.(record)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getStatusColor(record.status)}>
                      {getStatusLabel(record.status)}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(record.breedingDate), 'dd/MM/yyyy', { locale: es })}
                    </div>
                  </div>
                  <CardTitle className="text-lg">
                    {animalNames[record.motherId] || 'Madre'} × {animalNames[record.fatherId] || 'Padre'}
                  </CardTitle>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Método:</span>
                  <span className="font-medium">{getMethodLabel(record.breedingMethod)}</span>
                </div>

                {record.offspringCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <Baby className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600">Crías:</span>
                    <span className="font-medium text-blue-600">{record.offspringCount}</span>
                  </div>
                )}

                {gestationDuration && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">Gestación:</span>
                    <span className="font-medium text-green-600">{gestationDuration} días</span>
                  </div>
                )}
              </div>

              {(record.actualBirthDate || record.expectedDueDate) && (
                <div className="mt-3 flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600">
                    {record.actualBirthDate ? 'Nacimiento:' : 'Esperado:'}
                  </span>
                  <span className="font-medium text-purple-600">
                    {format(
                      new Date(record.actualBirthDate || record.expectedDueDate!), 
                      'dd/MM/yyyy', 
                      { locale: es }
                    )}
                  </span>
                </div>
              )}

              {record.pregnancyConfirmed && record.pregnancyConfirmationDate && (
                <div className="mt-3 flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Embarazo confirmado:</span>
                  <span className="font-medium text-green-600">
                    {format(new Date(record.pregnancyConfirmationDate), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500 flex items-center">
                <span>Haz clic para ver detalles completos</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BreedingRecordsList;
