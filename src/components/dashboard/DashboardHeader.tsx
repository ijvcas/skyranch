
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import FieldReportButton from '@/components/field-reports/FieldReportButton';
import WeatherBadge from '@/components/weather/WeatherBadge';
import WeatherWidget from '@/components/weather/WeatherWidget';

interface DashboardHeaderProps {
  userEmail?: string;
  userName?: string;
  totalAnimals: number;
  onForceRefresh: () => void;
}

const DashboardHeader = ({ userEmail, userName, totalAnimals, onForceRefresh }: DashboardHeaderProps) => {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
      <div className="flex-1">
        <div className="text-center mb-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Panel de Control
          </h1>
        </div>
        <p className="text-base text-gray-600 text-center">
          Bienvenido, {userName || userEmail}
        </p>
        
        <div className="mt-4">
          <WeatherWidget />
        </div>
        {totalAnimals === 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              No se encontraron animales. Si deberías ver animales, usa el botón "Forzar Actualización".
            </p>
            <Button 
              onClick={onForceRefresh} 
              className="mt-2 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Forzar Actualización
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto">
        <WeatherBadge />
        <div className="w-full md:w-auto">
          <FieldReportButton />
        </div>
        <Button
          variant="outline"
          onClick={onForceRefresh}
          className="flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
