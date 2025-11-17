import React from 'react';
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudFog,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';

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
  
  // Map conditions to Lucide weather icons
  const getIcon = (): LucideIcon => {
    // Unknown/no condition - fallback
    if (!condition || conditionLower === 'unknown') {
      return isDaytime ? Sun : Moon;
    }
    
    // Clear/Sunny
    if (/clear|despejado|limpo|dégagé/.test(conditionLower)) {
      return isDaytime ? Sun : Moon;
    }
    
    // Sunny (explicit)
    if (/sunny|soleado|ensoleillé|ensolarado/.test(conditionLower)) {
      return Sun;
    }
    
    // Partly Cloudy
    if (/partly|parcial|parcialmente|partiellement|intervalos/.test(conditionLower)) {
      return isDaytime ? CloudSun : CloudMoon;
    }
    
    // Mostly Cloudy
    if (/mostly.*cloud|mayormente.*nublado/.test(conditionLower)) {
      return Cloud;
    }
    
    // Cloudy
    if (/cloud|nubla|nuageux|nublado/.test(conditionLower)) {
      return Cloud;
    }
    
    // Thunderstorm
    if (/thunder|tormenta|orage|tempestade/.test(conditionLower)) {
      return Zap;
    }
    
    // Heavy Rain
    if (/heavy.*rain|lluvia.*fuerte|pluie.*forte|chuva.*forte|aguacero/.test(conditionLower)) {
      return CloudRain;
    }
    
    // Rain
    if (/rain|lluvia|pluie|chuva/.test(conditionLower)) {
      return CloudRain;
    }
    
    // Drizzle
    if (/drizzle|llovizna|bruine|garoa/.test(conditionLower)) {
      return CloudDrizzle;
    }
    
    // Snow
    if (/snow|nieve|neige|neve/.test(conditionLower)) {
      return CloudSnow;
    }
    
    // Sleet/Hail
    if (/sleet|hail|granizo|aguanieve|grésil|grêle/.test(conditionLower)) {
      return CloudSnow;
    }
    
    // Fog
    if (/fog|niebla|brouillard|neblina/.test(conditionLower)) {
      return CloudFog;
    }
    
    // Mist/Haze
    if (/mist|haze|neblina|brume|névoa/.test(conditionLower)) {
      return CloudFog;
    }
    
    // Windy
    if (/wind|viento|ventoso|windy|venteux/.test(conditionLower)) {
      return Wind;
    }
    
    // Dust/Smoke
    if (/dust|smoke|polvo|humo/.test(conditionLower)) {
      return CloudFog;
    }
    
    // Default
    return isDaytime ? Sun : Moon;
  };

  // Get color class based on condition
  const getColorClass = () => {
    if (/partly|parcial|parcialmente/.test(conditionLower)) {
      return 'text-amber-500';
    }
    if (/clear|despejado|sunny|soleado/.test(conditionLower)) {
      return 'text-amber-500';
    }
    if (/rain|lluvia|drizzle|llovizna/.test(conditionLower)) {
      return 'text-blue-500';
    }
    if (/thunder|tormenta/.test(conditionLower)) {
      return 'text-purple-500';
    }
    if (/snow|nieve/.test(conditionLower)) {
      return 'text-cyan-300';
    }
    if (/cloud|nubla/.test(conditionLower)) {
      return 'text-slate-500';
    }
    if (/fog|niebla|mist|neblina/.test(conditionLower)) {
      return 'text-gray-400';
    }
    if (/wind|viento/.test(conditionLower)) {
      return 'text-cyan-500';
    }
    
    return 'text-amber-500';
  };

  const Icon = getIcon();
  const colorClass = getColorClass();
  
  return (
    <Icon 
      size={size}
      className={`${colorClass} ${className} transition-transform duration-300 hover:scale-110 drop-shadow-lg`}
      aria-label={condition}
      strokeWidth={1.5}
    />
  );
};

// Helper function to get icon color class based on condition (for backward compatibility)
export const getWeatherIconColor = (condition: string): string => {
  const conditionLower = condition.toLowerCase();
  
  // Partly/Partially conditions
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
    return '#64748B';
  }
  if (/fog|niebla|mist|neblina/.test(conditionLower)) {
    return '#94A3B8';
  }
  if (/wind|viento/.test(conditionLower)) {
    return '#22D3EE';
  }
  
  return '#FBB040';
};
