
import { useQuery } from "@tanstack/react-query";
import { getCurrentWeather, type CurrentWeather } from "@/services/googleWeatherService";

export const useFarmWeather = (lat?: number, lng?: number) => {
  return useQuery<CurrentWeather | null>({
    queryKey: ["farm-weather", lat, lng],
    queryFn: async () => {
      const canFetch = typeof lat === "number" && typeof lng === "number";
      if (!canFetch) return null;

      const key = `weather:${lat},${lng}`;
      const now = Date.now();
      const TTL = 10 * 60 * 1000; // 10 min

      // 1) Try fresh cache first
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.ts && now - parsed.ts < TTL && parsed?.data) {
            console.log("🌤️ [useFarmWeather] cache hit", { key, ageMs: now - parsed.ts });
            return parsed.data as CurrentWeather;
          }
        }
      } catch (e) {
        console.warn("🌤️ [useFarmWeather] cache read failed", e);
      }

      // 2) Fetch from Edge Function (Google first)
      console.log("🌤️ [useFarmWeather] fetching from edge function (google)", { lat, lng });
      let data: CurrentWeather | null = null;
      try {
        data = await getCurrentWeather(lat as number, lng as number);
      } catch (err) {
        console.error("🌤️ [useFarmWeather] getCurrentWeather threw", err);
      }

      if (data && (data.temperatureC != null || data.conditionText != null)) {
        try {
          localStorage.setItem(key, JSON.stringify({ ts: now, data }));
        } catch (e) {
          console.warn("🌤️ [useFarmWeather] cache write failed", e);
        }
        console.log("🌤️ [useFarmWeather] fetch success, cached");
        return data;
      }

      // 3) Fallback: Use stale cache if available
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data) {
            console.log("🌤️ [useFarmWeather] using stale cached weather due to fetch failure");
            return parsed.data as CurrentWeather;
          }
        }
      } catch (_) {}

      // 4) Final fallback: approximate mock to keep UI consistent
      console.warn("🌤️ [useFarmWeather] using approximate weather fallback");
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
    staleTime: 10 * 60 * 1000, // 10 min
    retry: 1,
  });
};
