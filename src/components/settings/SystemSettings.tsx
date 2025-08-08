
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import SupportInfoSettings from './SupportInfoSettings';
import DashboardBannerSettings from './DashboardBannerSettings';
import TimezoneSettings from '@/components/TimezoneSettings';
import VersionControlPanel from '@/components/version-management/VersionControlPanel';
import VersionHistoryPanel from '@/components/version-management/VersionHistoryPanel';
import { useWeatherSettings } from '@/hooks/useWeatherSettings';

import { geocodeCity } from '@/services/placesService';
import { Button } from '@/components/ui/button';

const SystemSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.email === 'jvcas@mac.com';
  const { data: weatherSettings, isLoading: settingsLoading, save, saving } = useWeatherSettings();
  const [city, setCity] = useState('');
  const [validating, setValidating] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (weatherSettings) {
      const name = weatherSettings.display_name || weatherSettings.location_query;
      setCity(name);
      setValid(true);
    }
  }, [weatherSettings]);

  const handleValidateLocation = async () => {
    const trimmed = city.trim();
    if (!trimmed) {
      setValid(null);
      return;
    }

    setValidating(true);
    setValid(null);

    try {
      console.log('🌍 Validating location:', trimmed);
      const result = await geocodeCity(trimmed, 'es');
      console.log('🌍 Geocode result:', result);
      
      if (result) {
        setValid(true);
        if (isAdmin) {
          await save({
            location_query: trimmed,
            display_name: result.display_name,
            place_id: result.place_id,
            lat: result.lat,
            lng: result.lng,
          });
          toast({ 
            title: 'Ubicación guardada', 
            description: `${result.display_name} (${result.lat}, ${result.lng})`
          });
        } else {
          toast({ 
            title: 'Ubicación validada', 
            description: result.display_name 
          });
        }
      } else {
        setValid(false);
        toast({ 
          title: 'No se pudo validar la ubicación', 
          description: 'Verifica que el nombre de la ciudad sea correcto e intenta nuevamente.',
          variant: 'destructive' 
        });
      }
    } catch (error: any) {
      console.error('🌍 Error validating location:', error);
      setValid(false);
      toast({ 
        title: 'Error al validar la ubicación', 
        description: error?.message || 'Error de conexión. Verifica tu conexión a internet.',
        variant: 'destructive' 
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Support Info Panel at the top */}
      <SupportInfoSettings isAdmin={isAdmin} />

      {/* Weather Location Card */}
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">System Information</h3>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Weather Location</CardTitle>
            <CardDescription>
              Enter city name for local weather display on dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
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
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setValid(null); // Reset validation when user types
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleValidateLocation();
                        }
                      }}
                      disabled={validating || saving}
                      placeholder="e.g. Madrid, Spain"
                      aria-label="Weather location city"
                      className={`${valid === true ? 'border-green-500 focus-visible:ring-green-500' : valid === false ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {(validating || saving) ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : valid === true ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : valid === false ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : null}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleValidateLocation}
                    disabled={!city.trim() || validating || saving}
                    className="w-full"
                  >
                    {validating ? 'Validando...' : 'Validar Ubicación'}
                  </Button>
                  
                  <p className="text-sm text-muted-foreground">
                    Ingresa el nombre de una ciudad y haz clic en "Validar Ubicación" para configurar el clima del dashboard.
                  </p>
                </div>
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
