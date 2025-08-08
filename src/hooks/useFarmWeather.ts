
import { useQuery } from "@tanstack/react-query";
import { getCurrentWeather, type CurrentWeather } from "@/services/googleWeatherService";

export const useFarmWeather = (lat?: number, lng?: number) => {
  return useQuery<CurrentWeather | null>({
    queryKey: ["farm-weather", lat, lng],
    queryFn: () => getCurrentWeather(lat as number, lng as number),
    enabled: typeof lat === "number" && typeof lng === "number",
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1,
  });
};
