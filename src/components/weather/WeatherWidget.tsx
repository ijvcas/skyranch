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
      <Card className="bg-card text-card-foreground">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TempIcon className="h-8 w-8 text-yellow-500 mt-1 flex-shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              {/* Temperature - large and prominent */}
              <div className="text-2xl font-bold text-foreground mb-1">
                {settingsLoading || isLoading ? "—" :
                  typeof tempValue === "number" ? `${Math.round(tempValue)}°C` : "—"}
              </div>
              
              {/* Weather condition - detailed text like "Cielo Claro" */}
              <div className="text-base text-muted-foreground mb-2">
                {getWeatherCondition()}
              </div>
              
              {/* Location - smaller text below */}
              <div className="text-sm text-muted-foreground truncate">
                {formatLocation()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default WeatherWidget;
