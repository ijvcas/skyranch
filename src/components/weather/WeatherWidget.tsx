import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sun, Cloud, CloudRain, CloudSun, Snowflake, Wind } from "lucide-react";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";
import { useGoogleWeatherAPI } from "@/hooks/useGoogleWeatherAPI";

function pickIcon(text?: string | null) {
  const t = (text || "").toLowerCase();
  if (/lluvia|rain|chubasco/.test(t)) return CloudRain;
  if (/nieve|snow/.test(t)) return Snowflake;
  if (/viento|wind/.test(t)) return Wind;
  if (/nubes|cloud/.test(t)) return Cloud;
  if (/parcial|intervalos|partly/.test(t)) return CloudSun;
  return Sun;
}

const WeatherWidget: React.FC = () => {
  const { data: weatherSettings, isLoading: settingsLoading } = useWeatherSettings();
  console.log("🌤️ [WeatherWidget] Weather settings:", weatherSettings);
  console.log("🌤️ [WeatherWidget] Settings loading:", settingsLoading);
  
  const { data: weather, isLoading, error } = useGoogleWeatherAPI(weatherSettings?.location_query || undefined);
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
    <section aria-label="Clima actual" className="w-full max-w-sm mx-auto">
      <div className="p-3">
        <div className="flex items-start gap-2">
          <TempIcon className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" aria-hidden />
          <div className="flex-1 min-w-0">
            {/* Temperature - smaller, no bold */}
            <div className="text-lg text-foreground mb-0.5">
              {settingsLoading || isLoading ? "—" :
                typeof tempValue === "number" ? `${Math.round(tempValue)}°C` : "—"}
            </div>
            
            {/* Weather condition - smaller text */}
            <div className="text-sm text-muted-foreground mb-1">
              {getWeatherCondition()}
            </div>
            
            {/* Location - smaller text below */}
            <div className="text-xs text-muted-foreground truncate">
              {formatLocation()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeatherWidget;
