import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sun, Cloud, CloudRain, CloudSun, Snowflake, Wind } from "lucide-react";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";
import { useOpenWeatherAPI } from "@/hooks/useOpenWeatherAPI";

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
  const { data: settings, isLoading: settingsLoading } = useWeatherSettings();
  const lat = settings?.lat;
  const lng = settings?.lng;
  const displayName = settings?.display_name || "Ubicación";
  const unitSystem = (settings?.unit_system as "metric" | "imperial") || "metric";

  const { data: weather, isLoading } = useOpenWeatherAPI(
    lat,
    lng,
    {
      locationKey: displayName || (typeof lat === "number" && typeof lng === "number" ? `${lat},${lng}` : undefined),
      language: settings?.language || "es",
      unitSystem,
    }
  );

  const TempIcon = pickIcon(weather?.conditionText);
  const tempValue = unitSystem === "metric" ? weather?.temperatureC : weather?.temperatureF;
  const tempUnit = unitSystem === "metric" ? "°C" : "°F";

  return (
    <section aria-label="Clima actual" className="w-full">
      <Card className="bg-card text-card-foreground">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="text-sm text-muted-foreground">{displayName}</span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <TempIcon className="h-8 w-8" aria-hidden />
            <div>
              <div className="text-2xl font-semibold">
                {settingsLoading || isLoading ? "Cargando clima…" :
                  typeof tempValue === "number" ? `${Math.round(tempValue)}${tempUnit}` : "—"}
              </div>
              <div className="text-sm text-muted-foreground">
                {isLoading ? "Obteniendo condiciones…" : (weather?.conditionText || "Condición aproximada")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default WeatherWidget;
