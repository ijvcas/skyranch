import { WiCloud, WiRain, WiDaySunny, WiSnow, WiCloudy, WiThunderstorm } from "react-icons/wi";
import { DailyForecast } from "@/hooks/useWeatherForecast";
import { useTranslation } from "react-i18next";

interface TenDayForecastProps {
  data: DailyForecast[];
}

const getWeatherIcon = (condition: string) => {
  const conditionLower = condition.toLowerCase();
  
  // Rain/Drizzle
  if (conditionLower.includes("rain") || conditionLower.includes("lluvia") || 
      conditionLower.includes("drizzle") || conditionLower.includes("llovizna") ||
      conditionLower.includes("shower") || conditionLower.includes("chubasco") ||
      conditionLower.includes("pluie") || conditionLower.includes("chuva")) {
    return <WiRain className="weather-day-icon" />;
  }
  
  // Storm
  if (conditionLower.includes("storm") || conditionLower.includes("tormenta") ||
      conditionLower.includes("thunder") || conditionLower.includes("trueno") ||
      conditionLower.includes("orage") || conditionLower.includes("tempestade")) {
    return <WiThunderstorm className="weather-day-icon" />;
  }
  
  // Snow
  if (conditionLower.includes("snow") || conditionLower.includes("nieve") ||
      conditionLower.includes("sleet") || conditionLower.includes("aguanieve") ||
      conditionLower.includes("neige") || conditionLower.includes("neve")) {
    return <WiSnow className="weather-day-icon" />;
  }
  
  // Cloudy (including partial/overcast)
  if (conditionLower.includes("cloud") || conditionLower.includes("nublado") ||
      conditionLower.includes("nube") || conditionLower.includes("overcast") ||
      conditionLower.includes("encapotado") || conditionLower.includes("parcialmente") ||
      conditionLower.includes("nuageux") || conditionLower.includes("nublado") ||
      conditionLower.includes("partiellement") || conditionLower.includes("parcialmente")) {
    return <WiCloudy className="weather-day-icon" />;
  }
  
  // Sunny/Clear
  if (conditionLower.includes("sunny") || conditionLower.includes("soleado") ||
      conditionLower.includes("clear") || conditionLower.includes("despejado") ||
      conditionLower.includes("ensoleillé") || conditionLower.includes("limpo")) {
    return <WiDaySunny className="weather-day-icon" />;
  }
  
  // Default to cloudy for unknown conditions
  return <WiCloudy className="weather-day-icon" />;
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
              {getWeatherIcon(day.conditionText)}
              <div className="weather-temp-bar-container">
                <div 
                  className="weather-temp-bar-gradient"
                  style={{
                    background: `linear-gradient(90deg, #4169E1 0%, #FFD700 100%)`,
                    width: '100%'
                  }}
                />
              </div>
              <span className="weather-day-temps">
                <span style={{ color: '#4169E1' }}>L: {Math.round(day.minTempC)}°</span>
                {' / '}
                <span style={{ color: '#FFD700' }}>H: {Math.round(day.maxTempC)}°</span>
              </span>
              {day.precipitationChance > 0 && (
                <span className="weather-day-precip" style={{ fontWeight: '600' }}>💧 {day.precipitationChance}%</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
