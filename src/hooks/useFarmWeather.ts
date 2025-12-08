import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GoogleWeatherResponse {
  temperatureC: number | null;
  temperatureF: number | null;
  feelsLikeC: number | null;
  feelsLikeF: number | null;
  conditionText: string | null;
  conditionCode: string | null;
  windKph: number | null;
  windDirection: number | null;
  windCardinal: string | null;
  windGustKph: number | null;
  humidity: number | null;
  precipitationChance: number | null;
  precipitationMm: number | null;
  uvIndex: number | null;
  visibilityKm: number | null;
  pressureHpa: number | null;
  dewPointC: number | null;
  cloudCover: number | null;
  raw?: any;
}

export const useFarmWeather = (lat?: number, lng?: number, language: string = 'es') => {
  return useQuery<GoogleWeatherResponse | null>({
    queryKey: ["farm-weather-google", lat, lng, language],
    queryFn: async () => {
      const canFetch = typeof lat === "number" && typeof lng === "number";
      if (!canFetch) return null;

      const key = `weather-google:${lat},${lng}:${language}`;
      const now = Date.now();
      const TTL = 10 * 60 * 1000; // 10 min

      // 1) Try fresh cache first
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.ts && now - parsed.ts < TTL && parsed?.data) {
            console.log("🌤️ [useFarmWeather] Google Weather cache hit", { key, ageMs: now - parsed.ts });
            return parsed.data as GoogleWeatherResponse;
          }
        }
      } catch (e) {
        console.warn("🌤️ [useFarmWeather] cache read failed", e);
      }

      // 2) Fetch from Google Weather API
      console.log("🌤️ [useFarmWeather] fetching from Google Weather", { lat, lng, language });
      let data: GoogleWeatherResponse | null = null;
      try {
        const { data: responseData, error } = await supabase.functions.invoke("get-weather-google", {
          body: { lat, lng, language, unitSystem: "metric" },
        });

        if (error) {
          console.error("🌤️ [useFarmWeather] Google Weather fetch error", error);
        } else {
          data = responseData as GoogleWeatherResponse;
        }
      } catch (err) {
        console.error("🌤️ [useFarmWeather] Google Weather fetch failed", err);
      }

      if (data?.temperatureC != null) {
        try {
          localStorage.setItem(key, JSON.stringify({ ts: now, data }));
        } catch (e) {
          console.warn("🌤️ [useFarmWeather] cache write failed", e);
        }
        console.log("🌤️ [useFarmWeather] Google Weather fetch success, cached");
        return data;
      }

      // 3) Fallback: Use stale cache if available
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data) {
            console.log("🌤️ [useFarmWeather] using stale cached weather due to fetch failure");
            return parsed.data as GoogleWeatherResponse;
          }
        }
      } catch (_) {}

      // 4) Return null if all else fails
      console.warn("🌤️ [useFarmWeather] no weather data available");
      return null;
    },
    enabled: typeof lat === "number" && typeof lng === "number",
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
};
