import { WiCloud, WiRain, WiDaySunny, WiSnow, WiCloudy, WiThunderstorm } from "react-icons/wi";
import { DailyForecast } from "@/hooks/useWeatherForecast";
import { useTranslation } from "react-i18next";

interface TenDayForecastProps {
  data: DailyForecast[];
}

const getWeatherIcon = (condition: string) => {
  const conditionLower = condition.toLowerCase();
  
  // Rain/Drizzle - Blue
  if (conditionLower.includes("rain") || conditionLower.includes("lluvia") || 
      conditionLower.includes("drizzle") || conditionLower.includes("llovizna") ||
      conditionLower.includes("shower") || conditionLower.includes("chubasco") ||
      conditionLower.includes("pluie") || conditionLower.includes("chuva")) {
    return <WiRain className="weather-day-icon" style={{ color: '#60A5FA' }} />;
  }
  
  // Storm - Purple
  if (conditionLower.includes("storm") || conditionLower.includes("tormenta") ||
      conditionLower.includes("thunder") || conditionLower.includes("trueno") ||
      conditionLower.includes("orage") || conditionLower.includes("tempestade")) {
    return <WiThunderstorm className="weather-day-icon" style={{ color: '#A78BFA' }} />;
  }
  
  // Snow - Light icy blue
  if (conditionLower.includes("snow") || conditionLower.includes("nieve") ||
      conditionLower.includes("sleet") || conditionLower.includes("aguanieve") ||
      conditionLower.includes("neige") || conditionLower.includes("neve")) {
    return <WiSnow className="weather-day-icon" style={{ color: '#BAE6FD' }} />;
  }
  
  // Cloudy - Light gray
  if (conditionLower.includes("cloud") || conditionLower.includes("nublado") ||
      conditionLower.includes("nube") || conditionLower.includes("overcast") ||
      conditionLower.includes("encapotado") || conditionLower.includes("parcialmente") ||
      conditionLower.includes("nuageux") || conditionLower.includes("nublado") ||
      conditionLower.includes("partiellement") || conditionLower.includes("parcialmente")) {
    return <WiCloudy className="weather-day-icon" style={{ color: '#CBD5E1' }} />;
  }
  
  // Sunny/Clear - Golden amber
  if (conditionLower.includes("sunny") || conditionLower.includes("soleado") ||
      conditionLower.includes("clear") || conditionLower.includes("despejado") ||
      conditionLower.includes("ensoleillé") || conditionLower.includes("limpo")) {
    return <WiDaySunny className="weather-day-icon" style={{ color: '#FBB040' }} />;
  }
  
  // Default to cloudy for unknown conditions
  return <WiCloudy className="weather-day-icon" style={{ color: '#CBD5E1' }} />;
};

export default function TenDayForecast({ data }: TenDayForecastProps) {
  const { t, i18n } = useTranslation('weather');
  
  return (
    <div className="weather-ten-day">
      <h3 className="weather-section-title">{t('forecast.next5Days')}</h3>
      <div className="weather-frosted-card">
        {data.slice(0, 5).map((day, index) => {
          const date = new Date(day.date);
          const dayName = index === 0 
            ? t('forecast.today')
            : date.toLocaleDateString(i18n.language, { weekday: "short" }).charAt(0).toUpperCase() + 
              date.toLocaleDateString(i18n.language, { weekday: "short" }).slice(1);
          
          return (
            <div key={day.date} className="weather-day-row">
              <span className="weather-day-name">{dayName}</span>
              
              <div className="weather-icon-precip-group">
                {getWeatherIcon(day.conditionText)}
                {day.precipitationChance > 0 && (
                  <div className="weather-precip-info">
                    <span className="weather-precip-percent">{day.precipitationChance}%</span>
                    {day.totalPrecipitationMm > 0 && (
                      <span className="weather-precip-mm">{day.totalPrecipitationMm.toFixed(1)}mm</span>
                    )}
                  </div>
                )}
              </div>
              
              <span className="weather-temp-low">{day.minTempC.toFixed(1)}°</span>
              
              <div className="weather-temp-bar-container">
                <div 
                  className="weather-temp-bar-gradient"
                  style={{
                    background: `linear-gradient(90deg, #6B9BD1 0%, #FFB74D 100%)`,
                    width: '100%'
                  }}
                />
              </div>
              
              <span className="weather-temp-high">{day.maxTempC.toFixed(1)}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
