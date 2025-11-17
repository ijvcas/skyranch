import React from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";
import { useFarmWeather } from "@/hooks/useFarmWeather";
import { useTranslation } from 'react-i18next';
import { detectWeatherCondition } from '@/utils/weatherTranslation';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const WeatherWidget: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('weather');
  const { data: weatherSettings, isLoading: settingsLoading } = useWeatherSettings();
  
  // Make API call to get fresh weather data
  const { data: weather, isLoading: weatherLoading } = useFarmWeather(
    weatherSettings?.lat,
    weatherSettings?.lng,
    'es'
  );
  
  const tempValue = weather?.temperatureC;
  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 20;
  
  const formatLocation = () => {
    return weatherSettings?.display_name || t('location');
  };

  const getWeatherCondition = () => {
    if (settingsLoading || weatherLoading) return t('loading');
    if (!weatherSettings?.location_query) return t('noLocation');
    if (!weather?.conditionText) return t('tapForForecast');
    
    // Translate weather condition to app language
    const conditionKey = detectWeatherCondition(weather.conditionText);
    return t(`weatherConditions:${conditionKey}`);
  };

  const handleClick = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('🌤️ [WeatherWidget] Click detected - navigating to forecast');
    
    // Haptic feedback for native mobile
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (err) {
      // Haptics not available (web)
    }
    
    navigate('/weather/forecast');
  };

  return (
    <div 
      aria-label="Clima actual"
      onClick={handleClick}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleClick(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      className="cursor-pointer hover:opacity-80 transition-all duration-200 group active:opacity-60"
      style={{ 
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        userSelect: 'none'
      }}
    >
      <div className="flex items-start gap-3">
        <WeatherIcon 
          condition={weather?.conditionText || 'Unknown'}
          isDaytime={isDaytime}
          size={36}
          className={`drop-shadow-lg ${!weather ? 'opacity-70' : ''}`}
        />
        
        {/* Temperature and condition grouped */}
        <div className="flex-shrink-0">
          <div className="text-base text-foreground">
            {settingsLoading || weatherLoading ? "—" :
              typeof tempValue === "number" ? `${Math.round(tempValue)}°C` : "—"}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {getWeatherCondition()}
            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
