import { useTranslation } from "react-i18next";
import { DailyForecast } from "@/hooks/useWeatherForecast";
import { weatherAnalysisService } from "@/services/weatherAnalysisService";

interface RecommendationsProps {
  windKph: number | null;
  temperatureC: number | null;
  precipitationChance: number | null;
  dailyForecast?: DailyForecast[];
}

export default function Recommendations({ windKph, temperatureC, precipitationChance, dailyForecast }: RecommendationsProps) {
  const { t, i18n } = useTranslation('weather');
  const tips: string[] = [];
  
  // PRIORITY 1: Analyze 10-day forecast for extreme conditions (proactive warnings)
  if (dailyForecast && dailyForecast.length > 0) {
    const analysis = weatherAnalysisService.analyzeForecast(dailyForecast);
    
    if (analysis.hasExtremeConditions) {
      // Show proactive warnings about upcoming extreme weather
      const criticalEvents = analysis.events.filter(e => e.severity === 'critical').slice(0, 3);
      const highEvents = analysis.events.filter(e => e.severity === 'high').slice(0, 2);
      
      if (criticalEvents.length > 0 || highEvents.length > 0) {
        tips.push(`⚠️ ${t('forecast.extremeWeatherDetected')}`);
      }
      
      // Show critical events first with prominent timing
      criticalEvents.forEach(event => {
        const daysUntil = weatherAnalysisService.getDaysUntil(event.date);
        const formattedDate = weatherAnalysisService.formatDate(event.date, i18n.language);
        
        // Create prominent time prefix
        const timePrefix = daysUntil === 0 
          ? t('forecast.today').toUpperCase()
          : daysUntil === 1 
          ? t('forecast.tomorrow').toUpperCase()
          : t('forecast.inDays', { count: daysUntil }).toUpperCase();
        
        switch (event.type) {
          case 'heavy_rain':
            tips.push(`💧 ${timePrefix} (${formattedDate}): Lluvia fuerte — ${event.value}% probabilidad. ${t('forecast.heavyRain')}`);
            break;
          case 'extreme_heat':
            tips.push(`🔥 ${timePrefix} (${formattedDate}): Calor extremo — ${Math.round(event.value)}°C. ${t('forecast.extremeHeat')}`);
            break;
          case 'freezing':
            tips.push(`❄️ ${timePrefix} (${formattedDate}): Helada — ${Math.round(event.value)}°C. ${t('forecast.belowZero')}`);
            break;
          case 'strong_wind':
            tips.push(`🌬️ ${timePrefix} (${formattedDate}): Vientos fuertes — ${Math.round(event.value)} km/h. ${t('forecast.strongWind')}`);
            break;
        }
      });
      
      // Show some high priority events
      highEvents.forEach(event => {
        const daysUntil = weatherAnalysisService.getDaysUntil(event.date);
        const formattedDate = weatherAnalysisService.formatDate(event.date, i18n.language);
        const timePrefix = daysUntil === 0 
          ? t('forecast.today').toUpperCase()
          : daysUntil === 1 
          ? t('forecast.tomorrow').toUpperCase()
          : t('forecast.inDays', { count: daysUntil }).toUpperCase();
        
        tips.push(`⚠️ ${timePrefix} (${formattedDate}): ${event.description}`);
      });
      
      tips.push(`📋 ${t('forecast.planAccordingly')}`);
      
      // Return early - don't show current conditions when extreme weather is ahead
      return (
        <div className="weather-recommendations">
          {tips.map((tip, index) => (
            <p key={index} className="weather-recommendation-item">{tip}</p>
          ))}
        </div>
      );
    }
  }
  
  // PRIORITY 2: No extreme weather in forecast, show current conditions analysis
  console.log('🔍 Current conditions:', { windKph, temperatureC, precipitationChance });
  
  // Critical current weather alerts
  if (precipitationChance !== null && precipitationChance > 70) {
    tips.push(`💧 ${t('forecast.heavyRain')}`);
  }
  if (windKph !== null && windKph > 40) {
    tips.push(`⚠️ ${t('forecast.strongWind')}`);
  }
  if (temperatureC !== null && temperatureC > 32) {
    tips.push(`🔥 ${t('forecast.extremeHeat')}`);
  }
  if (temperatureC !== null && temperatureC < 0) {
    tips.push(`❄️ ${t('forecast.belowZero')}`);
  }
  
  // Moderate current weather warnings
  if (precipitationChance !== null && precipitationChance > 50 && precipitationChance <= 70) {
    tips.push(`🌧️ ${t('forecast.rainLikely')}`);
  }
  if (windKph !== null && windKph > 25 && windKph <= 40) {
    tips.push(`🌬️ ${t('forecast.moderateWind')}`);
  }
  if (temperatureC !== null && temperatureC > 28 && temperatureC <= 32) {
    tips.push(`☀️ ${t('forecast.highTemp')}`);
  }
  if (temperatureC !== null && temperatureC < 5 && temperatureC >= 0) {
    tips.push(`🥶 ${t('forecast.coldWeather')}`);
  }
  
  // Only show ideal conditions if NO warnings at all
  if (tips.length === 0) {
    tips.push(`✅ ${t('forecast.idealConditions')} — ${t('forecast.goodDay')}`);
  }
  
  return (
    <div className="weather-recommendations">
      {tips.map((tip, index) => (
        <p key={index} className="weather-recommendation-item">{tip}</p>
      ))}
    </div>
  );
}
