
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

const SystemSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.email === 'jvcas@mac.com';
  const { data: weatherSettings, isLoading: settingsLoading, save, saving } = useWeatherSettings();
  const [city, setCity] = useState('');
  const [validating, setValidating] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);
  const [lastValidated, setLastValidated] = useState<string | null>(null);
  useEffect(() => {
    if (weatherSettings) {
      const name = weatherSettings.display_name || weatherSettings.location_query;
      setCity(name);
      setLastValidated(name);
      setValid(true);
    }
  }, [weatherSettings]);
  

  useEffect(() => {
    if (settingsLoading) return;
    const trimmed = city.trim();
    if (!trimmed) { setValid(null); return; }
    if (weatherSettings && (trimmed === weatherSettings.display_name || trimmed === weatherSettings.location_query)) {
      setValid(true);
      return;
    }
    const t = setTimeout(async () => {
      setValidating(true);
      try {
        const res = await geocodeCity(trimmed, weatherSettings?.language || 'es');
        if (res) {
          setValid(true);
          setLastValidated(trimmed);
          if (isAdmin) {
            await save({
              location_query: trimmed,
              display_name: res.display_name,
              place_id: res.place_id,
              lat: res.lat,
              lng: res.lng,
            });
            toast({ title: 'Ubicación guardada', description: res.display_name });
          }
        } else {
          setValid(false);
        }
      } catch (e) {
        console.error(e);
        setValid(false);
      } finally {
        setValidating(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [city, isAdmin, save, settingsLoading, weatherSettings, toast]);

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
                <div className="relative">
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Madrid, ES"
                    aria-label="Weather location city"
                    className={`${valid === true ? 'border-green-500 focus-visible:ring-green-500' : valid === false ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {validating || saving ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : valid === true ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : valid === false ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Enter city name for local weather display on dashboard</p>
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
