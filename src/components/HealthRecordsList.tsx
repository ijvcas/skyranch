
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Edit, Trash2, User, Pill, FileText } from 'lucide-react';
import { HealthRecord } from '@/services/healthRecordService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HealthRecordsListProps {
  records: HealthRecord[];
  onEdit?: (record: HealthRecord) => void;
  onDelete?: (id: string) => void;
}

const HealthRecordsList: React.FC<HealthRecordsListProps> = ({ records, onEdit, onDelete }) => {
  const getRecordTypeLabel = (type: HealthRecord['recordType']) => {
    const labels = {
      vaccination: 'Vacunación',
      treatment: 'Tratamiento',
      checkup: 'Revisión',
      illness: 'Enfermedad',
      injury: 'Lesión',
      medication: 'Medicación',
      surgery: 'Cirugía'
    };
    return labels[type];
  };

  const getRecordTypeColor = (type: HealthRecord['recordType']) => {
    const colors = {
      vaccination: 'bg-green-100 text-green-800',
      treatment: 'bg-blue-100 text-blue-800',
      checkup: 'bg-purple-100 text-purple-800',
      illness: 'bg-red-100 text-red-800',
      injury: 'bg-orange-100 text-orange-800',
      medication: 'bg-yellow-100 text-yellow-800',
      surgery: 'bg-gray-100 text-gray-800'
    };
    return colors[type];
  };

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay registros de salud</h3>
          <p className="text-gray-500 text-center">
            Comienza agregando el primer registro médico para este animal.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <Card key={record.id} className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className={getRecordTypeColor(record.recordType)}>
                    {getRecordTypeLabel(record.recordType)}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(new Date(record.dateAdministered), 'dd/MM/yyyy', { locale: es })}
                  </div>
                </div>
                <CardTitle className="text-lg">{record.title}</CardTitle>
              </div>
              <div className="flex space-x-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(record)}
                    aria-label={`Editar registro: ${record.title}`}
                    title={`Editar registro: ${record.title}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(record.id)}
                    aria-label={`Eliminar registro: ${record.title}`}
                    title={`Eliminar registro: ${record.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {record.description && (
                <p className="text-gray-700">{record.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {record.veterinarian && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Veterinario:</span>
                    <span className="font-medium">{record.veterinarian}</span>
                  </div>
                )}

                {record.medication && (
                  <div className="flex items-center space-x-2">
                    <Pill className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Medicamento:</span>
                    <span className="font-medium">{record.medication}</span>
                  </div>
                )}

                {record.cost && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Costo:</span>
                    <span className="font-medium">${record.cost}</span>
                  </div>
                )}
              </div>

              {record.dosage && (
                <div className="text-sm">
                  <span className="text-gray-600">Dosis:</span>
                  <span className="font-medium ml-2">{record.dosage}</span>
                </div>
              )}

              {record.nextDueDate && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">Próximo vencimiento:</span>
                  <span className="font-medium text-blue-600">
                    {format(new Date(record.nextDueDate), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
              )}

              {record.notes && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Notas:</span> {record.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HealthRecordsList;
