
import { useQuery } from "@tanstack/react-query";
import { getCurrentWeather, type CurrentWeather } from "@/services/googleWeatherService";

export const useFarmWeather = (lat?: number, lng?: number) => {
  return useQuery<CurrentWeather | null>({
    queryKey: ["farm-weather-enhanced", lat, lng],
    queryFn: async () => {
      console.log('🌤️ WEATHER: Fetching weather data for:', lat, lng);
      const canFetch = typeof lat === "number" && typeof lng === "number";
      if (!canFetch) {
        console.log('🌤️ WEATHER: Invalid coordinates, returning null');
        return null;
      }

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Weather API timeout')), 10000)
      );

      try {
        const weatherPromise = getCurrentWeather(lat, lng);
        const result = await Promise.race([weatherPromise, timeoutPromise]) as CurrentWeather | null;
        
        console.log('🌤️ WEATHER: API result:', result);
        return result;
      } catch (error) {
        console.error('🌤️ WEATHER: API error:', error);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 2000,
    refetchOnWindowFocus: false,
    enabled: typeof lat === "number" && typeof lng === "number"
  });
};
