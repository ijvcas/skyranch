import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MapPin, FileText, Thermometer, Cloud } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FieldReport } from '@/services/fieldReportService';

interface FieldReportDetailDialogProps {
  report: FieldReport | null;
  isOpen: boolean;
  onClose: () => void;
}

const FieldReportDetailDialog: React.FC<FieldReportDetailDialogProps> = ({
  report,
  isOpen,
  onClose
}) => {
  if (!report) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pregnancy':
        return 'bg-pink-100 text-pink-800';
      case 'veterinary':
        return 'bg-red-100 text-red-800';
      case 'health':
        return 'bg-blue-100 text-blue-800';
      case 'infrastructure':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      general: 'General',
      pregnancy: 'Embarazo',
      veterinary: 'Veterinario',
      health: 'Salud',
      infrastructure: 'Infraestructura',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Completado',
      draft: 'Borrador',
      in_progress: 'En Progreso',
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <FileText className="w-5 h-5 mr-2" />
            {report.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Type Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getTypeColor(report.report_type)}>
              {getTypeLabel(report.report_type)}
            </Badge>
            <Badge className={getStatusColor(report.status)}>
              {getStatusLabel(report.status)}
            </Badge>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>
                Creado: {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </span>
            </div>

            {report.createdByName && (
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                <span>Creado por: {report.createdByName}</span>
              </div>
            )}

            {report.location_coordinates && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Ubicación registrada</span>
              </div>
            )}

            {report.temperature && (
              <div className="flex items-center text-sm text-gray-600">
                <Thermometer className="w-4 h-4 mr-2" />
                <span>Temperatura: {report.temperature}°C</span>
              </div>
            )}
          </div>

          {/* Weather Conditions */}
          {report.weather_conditions && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium flex items-center mb-2">
                <Cloud className="w-4 h-4 mr-2" />
                Condiciones Climáticas
              </h4>
              <p className="text-sm text-gray-700">{report.weather_conditions}</p>
            </div>
          )}

          {/* Notes */}
          {report.notes && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Notas</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.notes}</p>
            </div>
          )}

          {/* Update Information */}
          {report.updated_at !== report.created_at && (
            <div className="text-xs text-gray-500 border-t pt-4">
              Última actualización: {format(new Date(report.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FieldReportDetailDialog;