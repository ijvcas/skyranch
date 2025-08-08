import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CurrentWeather } from "@/services/googleWeatherService";

interface Options {
  locationKey?: string; // e.g., display name or lat,lng
  language?: string; // 'es' by default
  unitSystem?: "metric" | "imperial"; // default 'metric'
}

const TRY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function invokeWeatherFunction(
  name: string,
  lat: number,
  lng: number,
  language: string,
  unitSystem: string
): Promise<CurrentWeather | null> {
  try {
    console.log(`🌦️ [useOpenWeatherAPI] invoking ${name}`, { lat, lng, language, unitSystem });
    const { data, error } = await supabase.functions.invoke(name, {
      body: { lat, lng, language, unitSystem },
    });
    if (error) {
      console.warn(`🌦️ [useOpenWeatherAPI] ${name} error`, error);
      return null;
    }
    return data as CurrentWeather;
  } catch (err) {
    console.warn(`🌦️ [useOpenWeatherAPI] ${name} threw`, err);
    return null;
  }
}

export const useOpenWeatherAPI = (
  lat?: number,
  lng?: number,
  opts?: Options
) => {
  return useQuery<CurrentWeather | null>({
    queryKey: ["open-weather", lat, lng, opts?.locationKey, opts?.language, opts?.unitSystem],
    queryFn: async () => {
      const canFetch = typeof lat === "number" && typeof lng === "number";
      if (!canFetch) return null;

      const language = opts?.language ?? "es";
      const unitSystem = opts?.unitSystem ?? "metric";
      const lk = opts?.locationKey || `${lat},${lng}`;
      const key = `weather:${lk}`;
      const now = Date.now();

      // 1) Cache (fresh)
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.ts && now - parsed.ts < TRY_CACHE_TTL && parsed?.data) {
            console.log("🌦️ [useOpenWeatherAPI] cache hit", { key, ageMs: now - parsed.ts });
            return parsed.data as CurrentWeather;
          }
        }
      } catch (e) {
        console.warn("🌦️ [useOpenWeatherAPI] cache read failed", e);
      }

      // 2) Edge Functions: Google first, then generic fallback
      let data: CurrentWeather | null = null;
      console.log("🌦️ [useOpenWeatherAPI] fetching from get-weather-google", { lat, lng });
      data = await invokeWeatherFunction("get-weather-google", lat as number, lng as number, language, unitSystem);

      if (!data) {
        console.log("🌦️ [useOpenWeatherAPI] fallback to get-weather");
        data = await invokeWeatherFunction("get-weather", lat as number, lng as number, language, unitSystem);
      }

      if (data && (data.temperatureC != null || data.conditionText != null)) {
        try {
          localStorage.setItem(key, JSON.stringify({ ts: now, data }));
        } catch (e) {
          console.warn("🌦️ [useOpenWeatherAPI] cache write failed", e);
        }
        console.log("🌦️ [useOpenWeatherAPI] fetch success, cached");
        return data;
      }

      // 3) Stale cache
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data) {
            console.log("🌦️ [useOpenWeatherAPI] using stale cache due to fetch failure");
            return parsed.data as CurrentWeather;
          }
        }
      } catch (_) {}

      // 4) Approximate fallback
      console.warn("🌦️ [useOpenWeatherAPI] using approximate fallback");
      const approx: CurrentWeather = {
        temperatureC: 22,
        temperatureF: 72,
        conditionText: "Condición aproximada",
        windKph: 8,
        humidity: 60,
        precipitationChance: 10,
      };
      return approx;
    },
    enabled: typeof lat === "number" && typeof lng === "number",
    staleTime: TRY_CACHE_TTL,
    retry: 1,
  });
};
