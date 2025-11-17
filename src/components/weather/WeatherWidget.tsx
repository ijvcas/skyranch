import React from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";
import { useTranslation } from 'react-i18next';
import { detectWeatherCondition } from '@/utils/weatherTranslation';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface WeatherSnapshot {
  conditionText: string;
  temperatureC: number;
  timestamp: number;
}

const WeatherWidget: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('weather');
  const { data: weatherSettings, isLoading: settingsLoading } = useWeatherSettings();
  
  // Get cached weather data instead of making API call
  const getCachedWeather = (): WeatherSnapshot | null => {
    try {
      const cached = localStorage.getItem('farmika-weather-snapshot');
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is recent (< 30 minutes old)
        if (Date.now() - data.timestamp < 30 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error reading cached weather:', error);
    }
    return null;
  };

  const cachedWeather = getCachedWeather();
  const tempValue = cachedWeather?.temperatureC;
  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 20;
  
  const formatLocation = () => {
    return weatherSettings?.display_name || t('location');
  };

  const getWeatherCondition = () => {
    if (settingsLoading) return t('loading');
    if (!weatherSettings?.location_query) return t('noLocation');
    if (!cachedWeather?.conditionText) return t('tapForForecast');
    
    // Translate cached weather condition to app language
    const conditionKey = detectWeatherCondition(cachedWeather.conditionText);
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
          condition={cachedWeather?.conditionText || 'Unknown'}
          isDaytime={isDaytime}
          size={36}
          className={`drop-shadow-lg ${!cachedWeather ? 'opacity-70' : ''}`}
        />
        
        {/* Temperature and condition grouped */}
        <div className="flex-shrink-0">
          <div className="text-base text-foreground">
            {settingsLoading ? "—" :
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
