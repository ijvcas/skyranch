
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MapPin, CheckCircle2, AlertCircle, Save, Loader2 } from 'lucide-react';
import SupportInfoSettings from './SupportInfoSettings';
import DashboardBannerSettings from './DashboardBannerSettings';
import TimezoneSettings from '@/components/TimezoneSettings';
import VersionControlPanel from '@/components/version-management/VersionControlPanel';
import VersionHistoryPanel from '@/components/version-management/VersionHistoryPanel';
import { useWeatherSettings } from '@/hooks/useWeatherSettings';
import { useFarmWeather } from '@/hooks/useFarmWeather';
import { geocodeCity } from '@/services/placesService';

const SystemSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.email === 'jvcas@mac.com';
  const { data: weatherSettings, isLoading: settingsLoading, save, saving } = useWeatherSettings();
  const [city, setCity] = useState('');
  useEffect(() => {
    if (weatherSettings) {
      setCity(weatherSettings.display_name || weatherSettings.location_query);
    }
  }, [weatherSettings]);
  const { data: wx, isLoading: wxLoading } = useFarmWeather(weatherSettings?.lat, weatherSettings?.lng);

  const handleValidateAndSave = async () => {
    try {
      if (!city || !isAdmin) return;
      const res = await geocodeCity(city, 'es');
      if (!res) {
        toast({ title: 'No se pudo validar la ciudad', description: 'Intenta con un nombre más específico', variant: 'destructive' });
        return;
      }
      await save({
        location_query: city,
        display_name: res.display_name,
        place_id: res.place_id,
        lat: res.lat,
        lng: res.lng,
      });
      toast({ title: 'Ubicación guardada', description: `${res.display_name}` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error al guardar', description: String(e), variant: 'destructive' });
    }
  };
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
              Define aquí la ciudad que se usa para el clima. Debe ser validada por Google.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ciudad (ej. Madrid, ES)"
                    aria-label="Ciudad para clima"
                  />
                  <Button onClick={handleValidateAndSave} disabled={saving || !isAdmin} title={isAdmin ? 'Validar y guardar' : 'Solo administradores'}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Validar y guardar
                  </Button>
                </div>

                <div className={`rounded-md border p-4 ${wxLoading ? 'border-gray-200' : wx ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Weather Location</div>
                      <div className="text-lg font-semibold">{weatherSettings ? weatherSettings.display_name : 'Sin ubicación'}</div>
                    </div>
                    <div className="ml-3">
                      {wxLoading ? (
                        <Skeleton className="h-6 w-6 rounded-full" />
                      ) : wx ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>

                {weatherSettings ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">{weatherSettings.display_name}</div>
                      <div className="text-sm text-gray-500">Lat: {Number(weatherSettings.lat).toFixed(5)} · Lng: {Number(weatherSettings.lng).toFixed(5)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No hay una ciudad guardada. Ingresa una ciudad y guárdala.
                  </div>
                )}
              </>
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
