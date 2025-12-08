import { WiCloud, WiRain, WiDaySunny, WiSnow, WiCloudy, WiThunderstorm } from "react-icons/wi";
import { HourlyForecast as HourlyForecastType } from "@/hooks/useWeatherForecast";
import { useTranslation } from "react-i18next";

interface HourlyForecastProps {
  hourlyData: HourlyForecastType[];
  className?: string;
}

const getWeatherIcon = (condition: string) => {
  const conditionLower = condition.toLowerCase();
  
  // Rain/Drizzle - Blue
  if (conditionLower.includes("rain") || conditionLower.includes("lluvia") ||
      conditionLower.includes("drizzle") || conditionLower.includes("llovizna") ||
      conditionLower.includes("shower") || conditionLower.includes("chubasco")) {
    return <WiRain className="weather-hour-icon" style={{ color: '#60A5FA' }} />;
  }
  // Thunderstorm - Purple
  if (conditionLower.includes("storm") || conditionLower.includes("tormenta")) {
    return <WiThunderstorm className="weather-hour-icon" style={{ color: '#A78BFA' }} />;
  }
  // Snow - Light icy blue
  if (conditionLower.includes("snow") || conditionLower.includes("nieve")) {
    return <WiSnow className="weather-hour-icon" style={{ color: '#BAE6FD' }} />;
  }
  // Cloudy - Light gray
  if (conditionLower.includes("cloud") || conditionLower.includes("nublado")) {
    return <WiCloudy className="weather-hour-icon" style={{ color: '#CBD5E1' }} />;
  }
  // Clear/Sunny - Golden amber
  return <WiDaySunny className="weather-hour-icon" style={{ color: '#FBB040' }} />;
};

const formatHour = (timestamp: string, t: any) => {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const now = new Date();
  
  if (date.getDate() === now.getDate() && 
      date.getMonth() === now.getMonth() && 
      hour === now.getHours()) {
    return t('forecast.now');
  }
  
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

export default function HourlyForecast({ hourlyData, className }: HourlyForecastProps) {
  const { t } = useTranslation('weather');
  
  return (
    <div className={className}>
      <h3 className="weather-section-title">{t('forecast.next12Hours')}</h3>
      <div className="weather-hourly-scroll">
        {hourlyData.slice(0, 12).map((hour, index) => (
          <div key={index} className="weather-hour-card">
            <span className="weather-hour-time">
              {formatHour(hour.timestamp, t)}
            </span>
            {getWeatherIcon(hour.conditionText)}
            <span className="weather-hour-temp">
              {hour.temperatureC.toFixed(1)}°
            </span>
            {hour.precipitationChance > 0 && (
              <small className="weather-hour-precip">
                {hour.precipitationChance}%
                {hour.precipitationMm > 0 && (
                  <span style={{ display: 'block', fontSize: '9px', opacity: 0.8 }}>
                    {hour.precipitationMm.toFixed(1)}mm
                  </span>
                )}
              </small>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
