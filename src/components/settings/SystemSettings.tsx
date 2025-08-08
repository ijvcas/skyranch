
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

import { geocodeCity, suggestPlaces, getPlaceDetails, type PlacePrediction } from '@/services/placesService';

const SystemSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.email === 'jvcas@mac.com';
  const { data: weatherSettings, isLoading: settingsLoading, save, saving } = useWeatherSettings();
  const [city, setCity] = useState('');
  const [validating, setValidating] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);
  const [lastValidated, setLastValidated] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  useEffect(() => {
    if (weatherSettings) {
      const name = weatherSettings.display_name || weatherSettings.location_query;
      setCity(name);
      setLastValidated(name);
      setValid(true);
    }
  }, [weatherSettings]);
  
  // Suggestions (Places Autocomplete) on input change
  useEffect(() => {
    const trimmed = city.trim();
    if (!trimmed || settingsLoading) { setPredictions([]); setShowSuggestions(false); return; }
    setValid(null); // don't show red while typing
    const t = setTimeout(async () => {
      setValidating(true);
      try {
        const sugg = await suggestPlaces(trimmed, weatherSettings?.language || 'es');
        setPredictions(sugg);
        setShowSuggestions(sugg.length > 0);
      } catch (e) {
        console.error(e);
        setPredictions([]);
        setShowSuggestions(false);
      } finally {
        setValidating(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [city, settingsLoading, weatherSettings]);

  const handleValidateFreeText = async () => {
    const trimmed = city.trim();
    if (!trimmed) { setValid(null); return; }
    setValidating(true);
    setShowSuggestions(false);
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
        } else {
          toast({ title: 'Ubicación validada', description: res.display_name });
        }
      } else {
        setValid(false);
        toast({ title: 'No se pudo validar la ubicación', description: 'Intenta con otro término o selecciona de la lista.', variant: 'destructive' as any });
      }
    } catch (e: any) {
      console.error(e); setValid(false);
      toast({ title: 'Error validando la ubicación', description: e?.message || String(e), variant: 'destructive' as any });
    } finally {
      setValidating(false);
    }
  };

  const handleSelectPrediction = async (p: PlacePrediction) => {
    setCity(p.description);
    setShowSuggestions(false);
    setPredictions([]);
    setValidating(true);
    try {
      const details = await getPlaceDetails(p.place_id, weatherSettings?.language || 'es');
      if (details) {
        setValid(true);
        setLastValidated(p.description);
        if (isAdmin) {
          await save({
            location_query: p.description,
            display_name: details.display_name,
            place_id: details.place_id,
            lat: details.lat,
            lng: details.lng,
          });
          toast({ title: 'Ubicación guardada', description: details.display_name });
        }
      } else {
        setValid(false);
      }
    } catch (e) {
      console.error(e); setValid(false);
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
                <div className="relative">
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const trimmed = city.trim();
                        const first = predictions[0]?.description?.trim();
                        if (showSuggestions && first && first.toLowerCase() === trimmed.toLowerCase()) {
                          // auto-select exact match
                          handleSelectPrediction(predictions[0]);
                        } else {
                          handleValidateFreeText();
                        }
                      }
                    }}
                    onBlur={() => {
                      const trimmed = city.trim();
                      const first = predictions[0]?.description?.trim();
                      if (showSuggestions && first && first.toLowerCase() === trimmed.toLowerCase()) {
                        handleSelectPrediction(predictions[0]);
                        return;
                      }
                      // If user didn't pick a suggestion, try free-text validate
                      if (!showSuggestions) handleValidateFreeText();
                    }}
                    disabled={validating || saving}
                    placeholder="e.g. Madrid, ES"
                    aria-label="Weather location city"
                    className={`${valid === true ? 'border-green-500 focus-visible:ring-green-500' : valid === false ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {showSuggestions && predictions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                      <ul className="max-h-60 overflow-auto">
                        {predictions.map((p) => (
                          <li key={p.place_id}>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSelectPrediction(p)}
                              className="w-full text-left px-3 py-2 hover:bg-accent"
                            >
                              {p.description}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                <p className="text-sm text-muted-foreground">Start typing to see suggestions; pick one or tab out to validate.</p>
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
