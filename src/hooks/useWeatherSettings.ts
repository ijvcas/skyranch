import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { weatherSettingsService, type WeatherSettings } from '@/services/weatherSettingsService';

export const WEATHER_SETTINGS_KEY = ['weather-settings'];

export const useWeatherSettings = () => {
  const qc = useQueryClient();

  const query = useQuery<WeatherSettings | null>({
    queryKey: WEATHER_SETTINGS_KEY,
    queryFn: () => weatherSettingsService.get(),
    staleTime: 10 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof weatherSettingsService.upsert>[0]) => weatherSettingsService.upsert(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WEATHER_SETTINGS_KEY });
    },
  });

  const syncFromFarmMutation = useMutation({
    mutationFn: () => weatherSettingsService.syncFromFarmProfile(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WEATHER_SETTINGS_KEY });
    },
  });

  return { 
    ...query, 
    save: saveMutation.mutateAsync, 
    saving: saveMutation.isPending,
    syncFromFarm: syncFromFarmMutation.mutateAsync,
    syncingFromFarm: syncFromFarmMutation.isPending
  };
};
