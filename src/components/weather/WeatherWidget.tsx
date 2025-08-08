import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sun, Cloud, CloudRain, CloudSun, Snowflake, Wind } from "lucide-react";
import { useFarmProfile } from "@/hooks/useFarmProfile";
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
  const { data: farmProfile, isLoading: profileLoading } = useFarmProfile();
  
  // Parse coordinates from farm profile
  let lat: number | undefined;
  let lng: number | undefined;
  let hasCoordinates = false;
  
  if (farmProfile?.location_coordinates) {
    try {
      const coords = farmProfile.location_coordinates.split(',').map(c => parseFloat(c.trim()));
      if (coords.length === 2 && coords.every(c => !isNaN(c))) {
        lat = coords[0];
        lng = coords[1];
        hasCoordinates = true;
        console.log('🌍 Using farm coordinates for weather:', { lat, lng });
      }
    } catch (e) {
      console.warn('Failed to parse farm coordinates:', e);
    }
  }
  
  const { data: weather, isLoading } = useOpenWeatherAPI(lat, lng, { location: (farmProfile as any)?.weather_location });

  const TempIcon = pickIcon(weather?.conditionText);
  const tempValue = weather?.temperatureC;
  
  // Format location: prefer profile name; basic cleanup
  const formatLocation = () => {
    if (!farmProfile?.location_name) return (farmProfile as any)?.weather_location || "Ubicación";

    const locationName = farmProfile.location_name;
    const cleanName = locationName.replace(/^es:/, "");
    const formattedName = cleanName.replace(/_/g, " ");

    return formattedName;
  };

  const getWeatherCondition = () => {
    if (profileLoading || isLoading) return "Cargando clima...";
    const hasLocation = !!(farmProfile as any)?.weather_location || hasCoordinates;
    if (!hasLocation) return "Sin ubicación";
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
                  {profileLoading || isLoading ? "—" :
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
