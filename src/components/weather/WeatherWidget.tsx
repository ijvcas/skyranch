import React from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";
import { useFarmWeather } from "@/hooks/useFarmWeather";
import { useTranslation } from 'react-i18next';
import { detectWeatherCondition } from '@/utils/weatherTranslation';
import { WeatherIcon, getWeatherIconColor } from '@/components/weather/WeatherIcon';

const WeatherWidget: React.FC = () => {
  const navigate = useNavigate();
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

  const tempValue = weather?.temperatureC;
  const iconColor = getWeatherIconColor(weather?.conditionText || '');
  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 20;
  
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

  const handleClick = () => {
    navigate('/weather/forecast');
  };

  return (
    <section 
      aria-label="Clima actual"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      className="cursor-pointer hover:opacity-80 transition-all duration-200 group"
    >
      <div className="flex items-start gap-3">
        <WeatherIcon 
          condition={weather?.conditionText || 'Clear'}
          isDaytime={isDaytime}
          size={28}
          className={iconColor}
        />
        
        {/* Temperature and condition grouped */}
        <div className="flex-shrink-0">
          <div className="text-base text-foreground">
            {settingsLoading || isLoading ? "—" :
              typeof tempValue === "number" ? `${Math.round(tempValue)}°C` : "—"}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {getWeatherCondition()}
            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeatherWidget;
