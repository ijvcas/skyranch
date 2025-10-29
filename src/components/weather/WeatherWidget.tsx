import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sun, Cloud, CloudRain, CloudSun, Snowflake, Wind } from "lucide-react";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";
import { useGoogleWeatherAPI } from "@/hooks/useGoogleWeatherAPI";

function pickIcon(text?: string | null) {
  const t = (text || "").toLowerCase();
  
  // Rain patterns - include drizzle, light rain, heavy rain
  if (/lluvia|llovizna|garúa|rain|drizzle|chubasco|aguacero/.test(t)) return CloudRain;
  
  // Snow patterns
  if (/nieve|snow|nevada/.test(t)) return Snowflake;
  
  // Wind patterns
  if (/viento|wind|ventoso|windy/.test(t)) return Wind;
  
  // Cloudy patterns
  if (/nubes|nubla|cloud|overcast/.test(t)) return Cloud;
  
  // Partly cloudy patterns
  if (/parcial|intervalos|partly|soleado con nubes/.test(t)) return CloudSun;
  
  // Clear/sunny is the default
  return Sun;
}

const WeatherWidget: React.FC = () => {
  const { data: weatherSettings, isLoading: settingsLoading } = useWeatherSettings();
  console.log("🌤️ [WeatherWidget] Weather settings:", weatherSettings);
  console.log("🌤️ [WeatherWidget] Settings loading:", settingsLoading);
  
  const { data: weather, isLoading, error } = useGoogleWeatherAPI(
    weatherSettings?.location_query || undefined,
    weatherSettings ? { lat: weatherSettings.lat, lng: weatherSettings.lng } : undefined
  );
  console.log("🌤️ [WeatherWidget] Weather data:", weather);
  console.log("🌤️ [WeatherWidget] Weather loading:", isLoading);
  console.log("🌤️ [WeatherWidget] Weather error:", error);

  const TempIcon = pickIcon(weather?.conditionText);
  const tempValue = weather?.temperatureC;
  
  const formatLocation = () => {
    return weatherSettings?.display_name || "Ubicación";
  };

  const getWeatherCondition = () => {
    if (settingsLoading || isLoading) return "Cargando clima...";
    if (!weatherSettings?.location_query) return "Sin ubicación";
    if (!weather?.conditionText) return "Conectando...";
    return weather.conditionText;
  };

  return (
    <section aria-label="Clima actual">
      <div className="flex items-start gap-3">
        <TempIcon className="h-6 w-6 text-yellow-500 flex-shrink-0" aria-hidden />
        
        {/* Temperature and condition grouped */}
        <div className="flex-shrink-0">
          <div className="text-base text-foreground">
            {settingsLoading || isLoading ? "—" :
              typeof tempValue === "number" ? `${Math.round(tempValue)}°C` : "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {getWeatherCondition()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeatherWidget;
