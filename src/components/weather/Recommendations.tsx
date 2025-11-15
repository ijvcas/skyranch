import { useTranslation } from "react-i18next";

interface RecommendationsProps {
  windKph: number | null;
  temperatureC: number | null;
  precipitationChance: number | null;
}

export default function Recommendations({ windKph, temperatureC, precipitationChance }: RecommendationsProps) {
  const { t } = useTranslation('weather');
  const tips: string[] = [];
  
  console.log('🔍 Recommendations data:', { windKph, temperatureC, precipitationChance });
  
  // Critical weather alerts (check these first)
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
  
  // Moderate weather warnings
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
