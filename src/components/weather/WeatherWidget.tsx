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
  }
  
  const { data: weather, isLoading } = useFarmWeather(lat, lng);

  const TempIcon = pickIcon(weather?.conditionText);
  const tempValue = weather?.temperatureC;
  
  // Format location like in picture 2: "28649 Rozas de Puerto Real, Madrid, Spain"
  const formatLocation = () => {
    if (!farmProfile?.location_name) return "Ubicación";
    
    const locationName = farmProfile.location_name;
    // Remove "es:" prefix if present
    const cleanName = locationName.replace(/^es:/, '');
    // Replace underscores with spaces
    const formattedName = cleanName.replace(/_/g, ' ');
    
    // Try to format like "28649 Rozas de Puerto Real, Madrid, Spain"
    if (formattedName.toLowerCase().includes('rozas')) {
      return "28649 Rozas de Puerto Real, Madrid, Spain";
    }
    
    return formattedName;
  };

  const getWeatherCondition = () => {
    if (profileLoading || isLoading) return "Cargando…";
    if (!hasCoordinates || !weather?.conditionText) return "Condición aproximada";
    return weather.conditionText;
  };

  return (
    <section aria-label="Clima actual" className="w-full">
      <Card className="bg-card text-card-foreground">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <TempIcon className="h-7 w-7 text-muted-foreground" aria-hidden />
            <div className="flex-1">
              {/* Temperature and condition in one line like picture 2 */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold">
                  {profileLoading || isLoading ? "—" :
                    typeof tempValue === "number" ? `${Math.round(tempValue)}°C` : "—"}
                </span>
                <span className="text-lg text-muted-foreground">
                  {getWeatherCondition()}
                </span>
              </div>
              {/* Location below like picture 2 */}
              <div className="text-sm text-muted-foreground">
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
