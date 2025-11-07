
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ArrowLeft, Calendar } from 'lucide-react';
import { BreedingRecord } from '@/services/breedingService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BreedingDetailHeaderProps {
  record: BreedingRecord;
  animalNames: Record<string, string>;
  onEdit?: (record: BreedingRecord) => void;
  onDelete?: (id: string) => void;
  onBack: () => void;
  onEditClick: () => void;
}

const BreedingDetailHeader: React.FC<BreedingDetailHeaderProps> = ({ 
  record, 
  animalNames, 
  onEdit, 
  onDelete,
  onBack,
  onEditClick
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

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {animalNames[record.motherId] || 'Madre'} × {animalNames[record.fatherId] || 'Padre'}
            </h2>
            <p className="text-gray-500">
              Registro de apareamiento - {format(new Date(record.breedingDate), 'dd/MM/yyyy', { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <Button 
              onClick={onEditClick} 
              size="sm"
              variant="outline"
              className="p-2"
              aria-label="Editar"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="destructive"
              size="sm"
              onClick={() => onDelete(record.id)}
              className="p-2"
              aria-label="Eliminar"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center space-x-4">
        <Badge className={`${getStatusColor(record.status)} text-base px-3 py-1`}>
          {getStatusLabel(record.status)}
        </Badge>
        <div className="flex items-center text-gray-500">
          <Calendar className="w-4 h-4 mr-1" />
          <span>Fecha de apareamiento: {format(new Date(record.breedingDate), 'dd/MM/yyyy', { locale: es })}</span>
        </div>
      </div>
    </div>
  );
};

export default BreedingDetailHeader;
