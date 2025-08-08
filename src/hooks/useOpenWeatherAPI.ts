import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CurrentWeather } from "@/services/googleWeatherService";

interface Options {
  location?: string; // Optional free-form location (e.g., "Madrid, Spain")
  locationKey?: string; // Optional cache key override
  language?: string; // 'es' by default
  unitSystem?: "metric" | "imperial"; // default 'metric'
}

const TRY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function invokeWeatherFunction(
  name: string,
  body: Record<string, any>
): Promise<CurrentWeather | null> {
  try {
    console.log(`🌦️ [useOpenWeatherAPI] invoking ${name}`, body);
    const { data, error } = await supabase.functions.invoke(name, {
      body,
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
    queryKey: [
      "open-weather",
      lat,
      lng,
      opts?.location,
      opts?.locationKey,
      opts?.language,
      opts?.unitSystem,
    ],
    queryFn: async () => {
      const hasCoords = typeof lat === "number" && typeof lng === "number";
      const hasLocation = !!opts?.location && typeof opts.location === "string";
      if (!hasCoords && !hasLocation) return null;

      const language = opts?.language ?? "es";
      const unitSystem = opts?.unitSystem ?? "metric";
      const lk = opts?.locationKey || (hasLocation ? opts?.location : `${lat},${lng}`);
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

      // 2) Edge Functions: Google first, then OpenWeather fallback
      let data: CurrentWeather | null = null;
      const payloadBase = { language, unitSystem } as const;
      const payload = hasLocation
        ? { ...payloadBase, location: opts?.location }
        : { ...payloadBase, lat, lng };

      console.log("🌦️ [useOpenWeatherAPI] fetching from get-weather-google", payload);
      data = await invokeWeatherFunction("get-weather-google", payload);

      if (!data) {
        console.log("🌦️ [useOpenWeatherAPI] fallback to get-weather");
        data = await invokeWeatherFunction("get-weather", payload);
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
    enabled:
      (typeof lat === "number" && typeof lng === "number") ||
      (typeof opts?.location === "string" && opts.location.length > 0),
    staleTime: TRY_CACHE_TTL,
    retry: 1,
  });
};
