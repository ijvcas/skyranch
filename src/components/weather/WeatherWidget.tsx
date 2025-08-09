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
  const { data: weather, isLoading } = useGoogleWeatherAPI(weatherSettings?.location_query || undefined);

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
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <TempIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              {/* Temperature and condition in one line like picture 2 */}
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">
                  {settingsLoading || isLoading ? "—" :
                    typeof tempValue === "number" ? `${Math.round(tempValue)}°C` : "—"}
                </span>
                <span className="text-sm text-muted-foreground truncate">
                  {getWeatherCondition()}
                </span>
              </div>
              {/* Location below like picture 2 */}
              <div className="text-xs text-muted-foreground truncate">
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
