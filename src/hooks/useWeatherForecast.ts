import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HourlyForecast {
  timestamp: string;
  temperatureC: number;
  temperatureF: number;
  conditionText: string;
  windKph: number;
  humidity: number;
  precipitationChance: number;
  precipitationMm: number;
}

interface DailyForecast {
  date: string;
  maxTempC: number;
  minTempC: number;
  maxTempF: number;
  minTempF: number;
  conditionText: string;
  maxWindKph: number;
  avgHumidity: number;
  precipitationChance: number;
  totalPrecipitationMm: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherForecastResponse {
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  daily: DailyForecast[];
  hourly: HourlyForecast[];
}

const CACHE_KEY = 'weather_forecast_cache';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export const useWeatherForecast = (
  lat?: number,
  lng?: number,
  language: string = 'es',
  forecastDays: number = 10
) => {
  return useQuery<WeatherForecastResponse | null>({
    queryKey: ['weather-forecast', lat, lng, language, forecastDays],
    queryFn: async () => {
      if (!lat || !lng) {
        console.log('⏭️ Skipping forecast fetch - no coordinates');
        return null;
      }

      try {
        // Check cache first
        const cacheKey = `${CACHE_KEY}_${lat}_${lng}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (age < CACHE_TTL) {
            console.log('✅ Using cached weather forecast', { age: Math.round(age / 1000) + 's' });
            return data as WeatherForecastResponse;
          }
        }

        console.log('🌤️ Fetching weather forecast from API', { lat, lng, forecastDays });

        // Fetch from edge function
        const { data, error } = await supabase.functions.invoke('get-weather-forecast', {
          body: {
            lat,
            lng,
            language,
            unitSystem: 'metric',
            forecastDays,
            includeHourly: true,
          },
        });

        if (error) {
          console.error('Weather forecast error:', error);
          // Try to return stale cache if available
          if (cached) {
            console.log('⚠️ Using stale cache due to error');
            const { data: staleData } = JSON.parse(cached);
            return staleData as WeatherForecastResponse;
          }
          return null;
        }

        // Cache the result
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );

        console.log('✅ Weather forecast fetched and cached');
        return data as WeatherForecastResponse;

      } catch (error) {
        console.error('Error in useWeatherForecast:', error);
        // Try to return stale cache
        const cacheKey = `${CACHE_KEY}_${lat}_${lng}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          console.log('⚠️ Using stale cache due to exception');
          const { data: staleData } = JSON.parse(cached);
          return staleData as WeatherForecastResponse;
        }
        return null;
      }
    },
    enabled: typeof lat === 'number' && typeof lng === 'number',
    staleTime: CACHE_TTL,
    retry: 1,
  });
};
