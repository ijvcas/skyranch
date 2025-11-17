import React from 'react';
import {
  WiDaySunny,
  WiNightClear,
  WiCloudy,
  WiDayCloudy,
  WiNightAltCloudy,
  WiRain,
  WiDayRain,
  WiNightAltRain,
  WiThunderstorm,
  WiSnow,
  WiSnowflakeCold,
  WiFog,
  WiDayFog,
  WiDust,
  WiWindy,
  WiStrongWind,
  WiDayHail,
  WiSleet,
  WiSprinkle,
  WiShowers,
} from 'react-icons/wi';

interface WeatherIconProps {
  condition: string;
  isDaytime?: boolean;
  size?: number;
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  condition,
  isDaytime = true,
  size = 64,
  className = '',
}) => {
  const conditionLower = condition?.toLowerCase() || '';
  
  // Map conditions to professional weather icons
  const getIcon = () => {
    // Unknown/no condition - fallback
    if (!condition || conditionLower === 'unknown') {
      return isDaytime ? WiDaySunny : WiNightClear;
    }
    
    // Clear/Sunny
    if (/clear|despejado|limpo|dégagé/.test(conditionLower)) {
      return isDaytime ? WiDaySunny : WiNightClear;
    }
    
    // Sunny (explicit)
    if (/sunny|soleado|ensoleillé|ensolarado/.test(conditionLower)) {
      return WiDaySunny;
    }
    
    // Partly Cloudy
    if (/partly|parcial|parcialmente|partiellement|intervalos/.test(conditionLower)) {
      return isDaytime ? WiDayCloudy : WiNightAltCloudy;
    }
    
    // Mostly Cloudy
    if (/mostly.*cloud|mayormente.*nublado/.test(conditionLower)) {
      return WiCloudy;
    }
    
    // Cloudy
    if (/cloud|nubla|nuageux|nublado/.test(conditionLower)) {
      return WiCloudy;
    }
    
    // Thunderstorm
    if (/thunder|tormenta|orage|tempestade/.test(conditionLower)) {
      return WiThunderstorm;
    }
    
    // Heavy Rain
    if (/heavy.*rain|lluvia.*fuerte|pluie.*forte|chuva.*forte|aguacero/.test(conditionLower)) {
      return WiShowers;
    }
    
    // Rain
    if (/rain|lluvia|pluie|chuva/.test(conditionLower)) {
      return isDaytime ? WiDayRain : WiNightAltRain;
    }
    
    // Drizzle
    if (/drizzle|llovizna|bruine|garoa/.test(conditionLower)) {
      return WiSprinkle;
    }
    
    // Snow (heavy)
    if (/heavy.*snow|nieve.*fuerte|neige.*forte|neve.*forte/.test(conditionLower)) {
      return WiSnowflakeCold;
    }
    
    // Snow
    if (/snow|nieve|neige|neve/.test(conditionLower)) {
      return WiSnow;
    }
    
    // Sleet/Hail
    if (/sleet|hail|granizo|aguanieve|grésil|grêle/.test(conditionLower)) {
      return WiSleet;
    }
    
    // Fog
    if (/fog|niebla|brouillard|neblina/.test(conditionLower)) {
      return isDaytime ? WiDayFog : WiFog;
    }
    
    // Mist/Haze
    if (/mist|haze|neblina|brume|névoa/.test(conditionLower)) {
      return isDaytime ? WiDayFog : WiFog;
    }
    
    // Windy
    if (/wind|viento|ventoso|windy|venteux/.test(conditionLower)) {
      return WiStrongWind;
    }
    
    // Dust/Smoke
    if (/dust|smoke|polvo|humo/.test(conditionLower)) {
      return WiDust;
    }
    
    // Default
    return isDaytime ? WiDaySunny : WiNightClear;
  };

  // Get animation class based on condition
  const getAnimationClass = () => {
    if (/rain|lluvia/.test(conditionLower)) {
      return 'animate-bounce-slow';
    }
    if (/wind|viento/.test(conditionLower)) {
      return 'animate-sway';
    }
    if (/snow|nieve/.test(conditionLower)) {
      return 'animate-drift';
    }
    return '';
  };

  const Icon = getIcon();
  const animationClass = getAnimationClass();
  const iconColor = getWeatherIconColor(condition);
  
  return (
    <Icon 
      size={size}
      color={iconColor}
      className={`${className} transition-transform duration-300 hover:scale-110`}
      aria-label={condition}
    />
  );
};

// Helper function to get icon color based on condition
export const getWeatherIconColor = (condition: string): string => {
  const conditionLower = condition.toLowerCase();
  
  // Partly/Partially conditions - use golden color for visibility (check FIRST)
  if (/partly|parcial|parcialmente|partiellement|intervalos/.test(conditionLower)) {
    return '#FBB040';
  }
  
  if (/clear|despejado|sunny|soleado/.test(conditionLower)) {
    return '#FBB040';
  }
  if (/rain|lluvia|drizzle|llovizna/.test(conditionLower)) {
    return '#60A5FA';
  }
  if (/thunder|tormenta/.test(conditionLower)) {
    return '#A78BFA';
  }
  if (/snow|nieve/.test(conditionLower)) {
    return '#BAE6FD';
  }
  if (/cloud|nubla/.test(conditionLower)) {
    return '#64748B'; // Darker gray for better visibility
  }
  if (/fog|niebla|mist|neblina/.test(conditionLower)) {
    return '#94A3B8';
  }
  if (/wind|viento/.test(conditionLower)) {
    return '#22D3EE';
  }
  
  return '#FBB040'; // Default to golden for visibility
};
