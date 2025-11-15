import { useTranslation } from "react-i18next";

interface RecommendationsProps {
  windKph: number | null;
  temperatureC: number | null;
  precipitationChance: number | null;
}

export default function Recommendations({ windKph, temperatureC, precipitationChance }: RecommendationsProps) {
  const { t } = useTranslation('weather');
  const tips: string[] = [];
  
  // Critical weather alerts
  if (windKph && windKph > 40) {
    tips.push(`⚠️ ${t('forecast.strongWind')}`);
  }
  if (temperatureC && temperatureC > 32) {
    tips.push(`🔥 ${t('forecast.extremeHeat')}`);
  }
  if (temperatureC && temperatureC < 0) {
    tips.push(`❄️ ${t('forecast.belowZero')}`);
  }
  if (precipitationChance && precipitationChance > 70) {
    tips.push(`💧 ${t('forecast.heavyRain')}`);
  }
  
  // Moderate weather warnings
  if (windKph && windKph > 25 && windKph <= 40) {
    tips.push(`🌬️ Moderate wind conditions — monitor livestock and secure loose items.`);
  }
  if (temperatureC && temperatureC > 28 && temperatureC <= 32) {
    tips.push(`☀️ High temperatures — ensure adequate water supply for animals.`);
  }
  if (temperatureC && temperatureC < 5 && temperatureC >= 0) {
    tips.push(`🥶 Cold weather expected — prepare shelters for livestock.`);
  }
  if (precipitationChance && precipitationChance > 50 && precipitationChance <= 70) {
    tips.push(`🌧️ Rain likely — plan indoor activities and check drainage systems.`);
  }
  
  // Ideal conditions message
  if (tips.length === 0) {
    tips.push(`✅ ${t('forecast.idealConditions')} — Good day for outdoor farm activities.`);
  }
  
  if (tips.length === 0) return null;
  
  return (
    <div className="weather-recommendations">
      {tips.map((tip, index) => (
        <p key={index} className="weather-recommendation-item">{tip}</p>
      ))}
    </div>
  );
}
