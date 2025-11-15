import { useTranslation } from "react-i18next";

interface RecommendationsProps {
  windKph: number | null;
  temperatureC: number | null;
  precipitationChance: number | null;
}

export default function Recommendations({ windKph, temperatureC, precipitationChance }: RecommendationsProps) {
  const { t } = useTranslation('weather');
  const tips: string[] = [];
  
  if (windKph && windKph > 40) {
    tips.push(`⚠️ ${t('forecast.strongWind')}`);
  }
  if (temperatureC && temperatureC > 32) {
    tips.push(`🔥 ${t('forecast.extremeHeat')}`);
  }
  if (temperatureC && temperatureC < 0) {
    tips.push(`❄️ ${t('forecast.belowZero')}`);
  }
  if (precipitationChance && precipitationChance > 80) {
    tips.push(`💧 ${t('forecast.heavyRain')}`);
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
