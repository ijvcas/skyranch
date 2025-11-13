import React from "react";
import { MapPin, Sun, Cloud, CloudRain, CloudSun, Snowflake, Wind } from "lucide-react";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";
import { useFarmWeather } from "@/hooks/useFarmWeather";
import { useTranslation } from 'react-i18next';
import { detectWeatherCondition } from '@/utils/weatherTranslation';

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

function pickIconColor(text?: string | null) {
  const t = (text || "").toLowerCase();
  
  // Rain patterns - vivid blue
  if (/lluvia|llovizna|garúa|rain|drizzle|chubasco|aguacero/.test(t)) return "text-sky-600";
  
  // Snow patterns - icy cyan
  if (/nieve|snow|nevada/.test(t)) return "text-cyan-300";
  
  // Wind patterns - slate gray
  if (/viento|wind|ventoso|windy/.test(t)) return "text-slate-500";
  
  // Cloudy/overcast patterns - darker gray
  if (/nubes|nubla|cloud|overcast|cubierto/.test(t)) return "text-slate-600";
  
  // Partly cloudy patterns - warm orange
  if (/parcial|intervalos|partly|soleado con nubes/.test(t)) return "text-orange-400";
  
  // Clear/sunny - golden yellow
  return "text-amber-400";
}

const WeatherWidget: React.FC = () => {
  const { t } = useTranslation('weather');
  const { data: weatherSettings, isLoading: settingsLoading } = useWeatherSettings();
  console.log("🌤️ [WeatherWidget] Weather settings:", weatherSettings);
  console.log("🌤️ [WeatherWidget] Settings loading:", settingsLoading);
  
  const { data: weather, isLoading, error } = useFarmWeather(
    weatherSettings?.lat,
    weatherSettings?.lng,
    weatherSettings?.language || 'es'
  );
  console.log("🌤️ [WeatherWidget] Weather data:", weather);
  console.log("🌤️ [WeatherWidget] Weather loading:", isLoading);
  console.log("🌤️ [WeatherWidget] Weather error:", error);

  const TempIcon = pickIcon(weather?.conditionText);
  const iconColor = pickIconColor(weather?.conditionText);
  const tempValue = weather?.temperatureC;
  
  const formatLocation = () => {
    return weatherSettings?.display_name || t('location');
  };

  const getWeatherCondition = () => {
    if (settingsLoading || isLoading) return t('loading');
    if (!weatherSettings?.location_query) return t('noLocation');
    if (!weather?.conditionText) return t('connecting');
    
    // Translate weather condition to app language
    const conditionKey = detectWeatherCondition(weather.conditionText);
    return t(`weatherConditions:${conditionKey}`);
  };

  return (
    <section aria-label="Clima actual">
      <div className="flex items-start gap-3">
        <TempIcon className={`h-7 w-7 ${iconColor} flex-shrink-0`} strokeWidth={2.5} aria-hidden />
        
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
