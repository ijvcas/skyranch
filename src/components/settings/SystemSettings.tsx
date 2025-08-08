
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { MapPin } from 'lucide-react';
import SupportInfoSettings from './SupportInfoSettings';
import DashboardBannerSettings from './DashboardBannerSettings';
import TimezoneSettings from '@/components/TimezoneSettings';
import VersionControlPanel from '@/components/version-management/VersionControlPanel';
import VersionHistoryPanel from '@/components/version-management/VersionHistoryPanel';
import { useFarmLocation } from '@/hooks/useFarmLocation';
import { Skeleton } from '@/components/ui/skeleton';

const SystemSettings = () => {
  const { user } = useAuth();
  const isAdmin = user?.email === 'jvcas@mac.com';
  const { data: farm, isLoading: locLoading } = useFarmLocation();


  


  return (
    <div className="space-y-6">
      {/* Support Info Panel at the top */}
      <SupportInfoSettings isAdmin={isAdmin} />
      
      {/* Weather Location Card */}
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Información del Sistema</h3>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Ubicación para Clima
            </CardTitle>
            <CardDescription>
              La ubicación que se usa para el clima proviene de la Propiedad principal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {locLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            ) : farm ? (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">{farm.name}</div>
                  <div className="text-sm text-gray-500">Lat: {farm.lat.toFixed(5)} · Lng: {farm.lng.toFixed(5)}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No hay una Propiedad principal con coordenadas válidas. Configúrala en la sección de Propiedades.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Dashboard Banner Settings */}
      <DashboardBannerSettings />
      
      {/* Timezone Settings */}
      <TimezoneSettings />
      
      {/* Version Management Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gestión de Versiones</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VersionControlPanel />
          <VersionHistoryPanel />
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
