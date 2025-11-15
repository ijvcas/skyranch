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
      tips.push(`⚠️ ${t('forecast.extremeWeatherDetected')}`);
      
      const criticalEvents = analysis.events.filter(e => e.severity === 'critical').slice(0, 3);
      const highEvents = analysis.events.filter(e => e.severity === 'high').slice(0, 2);
      
      // Show critical events first
      criticalEvents.forEach(event => {
        const daysUntil = weatherAnalysisService.getDaysUntil(event.date);
        const formattedDate = weatherAnalysisService.formatDate(event.date, i18n.language);
        const timeframe = daysUntil === 0 ? t('forecast.today') : daysUntil === 1 ? t('forecast.tomorrow') : `${formattedDate}`;
        
        switch (event.type) {
          case 'heavy_rain':
            tips.push(`💧 ${t('forecast.heavyRainOn', { date: timeframe })} (${event.value}%)`);
            break;
          case 'extreme_heat':
            tips.push(`🔥 ${t('forecast.extremeHeatOn', { date: timeframe })} (${Math.round(event.value)}°C)`);
            break;
          case 'freezing':
            tips.push(`❄️ ${t('forecast.freezingOn', { date: timeframe })} (${Math.round(event.value)}°C)`);
            break;
          case 'strong_wind':
            tips.push(`🌬️ ${t('forecast.strongWindOn', { date: timeframe })} (${Math.round(event.value)} km/h)`);
            break;
        }
      });
      
      // Show some high priority events
      highEvents.forEach(event => {
        const formattedDate = weatherAnalysisService.formatDate(event.date, i18n.language);
        tips.push(`⚠️ ${event.description} - ${formattedDate}`);
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
