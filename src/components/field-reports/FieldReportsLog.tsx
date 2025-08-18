
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Calendar, User, MapPin } from 'lucide-react';
import { useFieldReports } from '@/hooks/useFieldReports';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FieldReportDetailDialog from './FieldReportDetailDialog';
import { FieldReport } from '@/services/fieldReportService';

const FieldReportsLog = () => {
  const { data: reports, isLoading, error } = useFieldReports();
  const [selectedReport, setSelectedReport] = useState<FieldReport | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const handleViewDetails = (report: FieldReport) => {
    setSelectedReport(report);
    setIsDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedReport(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Reportes de Campo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Cargando reportes...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Reportes de Campo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">Error al cargar los reportes</div>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Reportes de Campo ({reports?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!reports || reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay reportes de campo registrados</p>
            <p className="text-sm">Los reportes aparecerán aquí una vez que se creen</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getTypeColor(report.report_type)}>
                        {getTypeLabel(report.report_type)}
                      </Badge>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status === 'completed' ? 'Completado' : 
                         report.status === 'draft' ? 'Borrador' :
                         report.status === 'in_progress' ? 'En Progreso' : report.status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(report)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Detalles
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </div>
                  
                  {report.createdByName && (
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      Creado por: {report.createdByName}
                    </div>
                  )}
                  
                  {report.weather_conditions && (
                    <div className="flex items-center">
                      <span className="w-4 h-4 mr-1">🌤️</span>
                      {report.weather_conditions}
                      {report.temperature && ` (${report.temperature}°C)`}
                    </div>
                  )}
                  
                  {report.location_coordinates && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Ubicación registrada
                    </div>
                  )}
                </div>

                {report.notes && (
                  <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {report.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <FieldReportDetailDialog
        report={selectedReport}
        isOpen={isDetailDialogOpen}
        onClose={closeDetailDialog}
      />
    </Card>
  );
};

export default FieldReportsLog;
