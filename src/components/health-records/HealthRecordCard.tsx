
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import HealthRecordBadge from './HealthRecordBadge';
import HealthRecordExpandedView from './HealthRecordExpandedView';

interface HealthRecord {
  id: string;
  animalId: string;
  recordType: string;
  title: string;
  description?: string;
  veterinarian?: string;
  medication?: string;
  dosage?: string;
  cost?: number;
  dateAdministered: string;
  nextDueDate?: string;
  notes?: string;
}

interface HealthRecordCardProps {
  record: HealthRecord;
  isExpanded: boolean;
  onToggleExpanded: (recordId: string) => void;
  onEdit: (record: HealthRecord) => void;
  onDelete: (record: HealthRecord) => void;
}

const HealthRecordCard: React.FC<HealthRecordCardProps> = ({
  record,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onDelete
}) => {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1">
            <HealthRecordBadge recordType={record.recordType} />
            <div className="flex items-center space-x-1 text-gray-500">
              <span className="text-sm">
                {format(new Date(record.dateAdministered), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleExpanded(record.id)}
              className="h-8 w-8 p-0"
              aria-label={isExpanded ? 'Contraer detalles' : 'Ver detalles'}
              title={isExpanded ? 'Contraer detalles' : 'Ver detalles'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(record)}
              className="h-8 w-8 p-0"
              aria-label={`Editar registro: ${record.title}`}
              title={`Editar registro: ${record.title}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(record)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              aria-label={`Eliminar registro: ${record.title}`}
              title={`Eliminar registro: ${record.title}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <h4 className="font-semibold text-lg text-gray-900 mb-2">{record.title}</h4>
        
        {/* Always show basic description */}
        {record.description && (
          <p className="text-gray-700 mb-3 leading-relaxed line-clamp-2">
            {record.description}
          </p>
        )}

        {/* Expanded view */}
        {isExpanded && (
          <HealthRecordExpandedView record={record} />
        )}

        {/* Collapsed view - show only cost if available */}
        {!isExpanded && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {record.cost && (
              <span>${record.cost}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthRecordCard;
