
import { supabase } from "@/integrations/supabase/client";

export interface CurrentWeather {
  temperatureC: number | null;
  temperatureF: number | null;
  conditionText: string | null;
  windKph: number | null;
  humidity: number | null;
  precipitationChance: number | null;
  raw?: any;
}

export const getCurrentWeather = async (lat: number, lng: number): Promise<CurrentWeather | null> => {
  console.log("🌤️ getCurrentWeather for", lat, lng);
  const { data, error } = await supabase.functions.invoke("weather-current", {
    body: { lat, lng, language: "es", unitSystem: "metric" },
  });

  if (error) {
    console.error("Weather function error:", error);
    return null;
  }
  return data as CurrentWeather;
};
