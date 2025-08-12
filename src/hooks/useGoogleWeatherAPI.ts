import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CurrentWeather } from "@/services/googleWeatherService";

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const useGoogleWeatherAPI = (location?: string, coords?: { lat?: number; lng?: number }) => {
  console.log("🌤️ [useGoogleWeatherAPI] Hook called with location:", location, "coords:", coords);
  
  return useQuery<CurrentWeather | null>({
    queryKey: ["google-weather", location, coords?.lat, coords?.lng],
    queryFn: async () => {
      console.log("🌤️ [useGoogleWeatherAPI] Query function executing for:", location, "coords:", coords);
      
      if ((!location || typeof location !== "string" || location.trim().length === 0) &&
          !(typeof coords?.lat === "number" && typeof coords?.lng === "number")) {
        console.log("🌤️ [useGoogleWeatherAPI] No valid location or coords, returning null");
        return null;
      }

      const keyBase = (location && typeof location === "string" && location.trim().length > 0)
        ? location.trim()
        : (typeof coords?.lat === "number" && typeof coords?.lng === "number")
        ? `lat:${coords.lat},lng:${coords.lng}`
        : "unknown";
      const key = `weather:${keyBase}`;
      const now = Date.now();

      // 1) Try fresh cache first
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.ts && now - parsed.ts < CACHE_TTL && parsed?.data) {
            console.log("🌤️ [useGoogleWeatherAPI] cache hit", { key, ageMs: now - parsed.ts });
            return parsed.data as CurrentWeather;
          }
        }
      } catch (e) {
        console.warn("🌤️ [useGoogleWeatherAPI] cache read failed", e);
      }

      // 2) Fetch from Google Weather Edge Function
      console.log("🌤️ [useGoogleWeatherAPI] Calling get-weather-google with:", { 
        location: location?.trim(),
        coords,
        language: "es", 
        unitSystem: "metric" 
      });
      
      let data: CurrentWeather | null = null;
      
      // First attempt: Using Supabase client
      try {
        console.log("🌤️ [useGoogleWeatherAPI] Invoking supabase.functions.invoke...");
        const { data: functionData, error } = await supabase.functions.invoke("get-weather-google", {
          body: { 
            ...(location?.trim() ? { location: location.trim() } : {}),
            ...(typeof coords?.lat === "number" && typeof coords?.lng === "number" ? { lat: coords.lat, lng: coords.lng } : {}),
            language: "es", 
            unitSystem: "metric" 
          },
        });
        
        console.log("🌤️ [useGoogleWeatherAPI] Edge function response:", { functionData, error });
        
        if (error) {
          console.error("🌤️ [useGoogleWeatherAPI] Supabase invoke error:", error);
          throw new Error(`Supabase invoke failed: ${error.message}`);
        } else if (functionData) {
          data = functionData as CurrentWeather;
          console.log("🌤️ [useGoogleWeatherAPI] SUCCESS: Got real weather data:", data);
        }
      } catch (supabaseError) {
        console.error("🌤️ [useGoogleWeatherAPI] Supabase call failed:", supabaseError);
        throw supabaseError;
      }

      if (data && (data.temperatureC != null || data.conditionText != null)) {
        try {
          localStorage.setItem(key, JSON.stringify({ ts: now, data }));
        } catch (e) {
          console.warn("🌤️ [useGoogleWeatherAPI] cache write failed", e);
        }
        console.log("🌤️ [useGoogleWeatherAPI] fetch success, cached and returning REAL weather data");
        return data;
      }

      // 3) Fallback: Use stale cache if available
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data) {
            console.log("🌤️ [useGoogleWeatherAPI] using stale cached weather due to fetch failure");
            return parsed.data as CurrentWeather;
          }
        }
      } catch (_) {}

      // 4) NO MORE MOCK FALLBACK - FORCE THE ERROR TO BE VISIBLE
      console.error("🌤️ [useGoogleWeatherAPI] CRITICAL: All weather data sources failed - no mock fallback");
      throw new Error("Failed to fetch weather data from all sources. Check API keys and network connectivity.");
    },
    enabled: (typeof location === "string" && location.trim().length > 0) ||
      (typeof coords?.lat === "number" && typeof coords?.lng === "number"),
    staleTime: CACHE_TTL,
    retry: 1,
  });
};
