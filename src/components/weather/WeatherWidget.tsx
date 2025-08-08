import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sun, Cloud, CloudRain, CloudSun, Snowflake, Wind } from "lucide-react";
import { useFarmProfile } from "@/hooks/useFarmProfile";
import { useFarmWeather } from "@/hooks/useFarmWeather";

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
  } else {
    console.log('🌍 No farm coordinates available, using approximate weather data');
  }
  
  const displayName = farmProfile?.location_name || farmProfile?.farm_name || "Ubicación";

  const { data: weather, isLoading } = useFarmWeather(lat, lng);

  const TempIcon = pickIcon(weather?.conditionText);
  const tempValue = weather?.temperatureC; // Always use Celsius
  const tempUnit = "°C";
  
  // Determine weather status message
  const getWeatherStatus = () => {
    if (profileLoading || isLoading) return "Cargando…";
    if (!hasCoordinates) return "Datos aproximados - configura ubicación en Perfil de Finca";
    return weather?.conditionText || "Tiempo real";
  };

  return (
    <section aria-label="Clima actual" className="w-full">
      <Card className="bg-card text-card-foreground">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="text-sm text-muted-foreground">{displayName}</span>
          </div>

          <div className="flex items-center gap-3">
            <TempIcon className="h-6 w-6 text-muted-foreground" aria-hidden />
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">
                {profileLoading || isLoading ? "—" :
                  typeof tempValue === "number" ? `${Math.round(tempValue)}${tempUnit}` : "—"}
              </span>
              <span className={`text-sm ${!hasCoordinates && !isLoading ? 'text-orange-600' : 'text-muted-foreground'}`}>
                {getWeatherStatus()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default WeatherWidget;
