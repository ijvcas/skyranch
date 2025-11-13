import { useQuery } from "@tanstack/react-query";
import { appleWeatherService, type AppleWeatherResponse } from "@/services/appleWeatherService";

export const useFarmWeather = (lat?: number, lng?: number, language: string = 'es') => {
  return useQuery<AppleWeatherResponse | null>({
    queryKey: ["farm-weather-apple", lat, lng, language],
    queryFn: async () => {
      const canFetch = typeof lat === "number" && typeof lng === "number";
      if (!canFetch) return null;

      const key = `weather-apple:${lat},${lng}:${language}`;
      const now = Date.now();
      const TTL = 10 * 60 * 1000; // 10 min

      // 1) Try fresh cache first
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.ts && now - parsed.ts < TTL && parsed?.data) {
            console.log("🌤️ [useFarmWeather] Apple WeatherKit cache hit", { key, ageMs: now - parsed.ts });
            return parsed.data as AppleWeatherResponse;
          }
        }
      } catch (e) {
        console.warn("🌤️ [useFarmWeather] cache read failed", e);
      }

      // 2) Fetch from Apple WeatherKit
      console.log("🌤️ [useFarmWeather] fetching from Apple WeatherKit", { lat, lng, language });
      let data: AppleWeatherResponse | null = null;
      try {
        data = await appleWeatherService.getCurrentWeather(lat as number, lng as number, language);
      } catch (err) {
        console.error("🌤️ [useFarmWeather] Apple WeatherKit fetch failed", err);
      }

      if (data?.current) {
        try {
          localStorage.setItem(key, JSON.stringify({ ts: now, data }));
        } catch (e) {
          console.warn("🌤️ [useFarmWeather] cache write failed", e);
        }
        console.log("🌤️ [useFarmWeather] Apple WeatherKit fetch success, cached");
        return data;
      }

      // 3) Fallback: Use stale cache if available
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data) {
            console.log("🌤️ [useFarmWeather] using stale cached weather due to fetch failure");
            return parsed.data as AppleWeatherResponse;
          }
        }
      } catch (_) {}

      // 4) Return null if all else fails - let components handle the empty state
      console.warn("🌤️ [useFarmWeather] no weather data available");
      return null;
    },
    enabled: typeof lat === "number" && typeof lng === "number",
    staleTime: 10 * 60 * 1000, // 10 min
    retry: 1,
  });
};
