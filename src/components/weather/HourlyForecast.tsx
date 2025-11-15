import { WiCloud, WiRain, WiDaySunny, WiSnow, WiCloudy, WiThunderstorm } from "react-icons/wi";
import { HourlyForecast as HourlyForecastType } from "@/hooks/useWeatherForecast";

interface HourlyForecastProps {
  hourlyData: HourlyForecastType[];
  className?: string;
}

const getWeatherIcon = (condition: string) => {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes("rain") || conditionLower.includes("lluvia")) {
    return <WiRain className="weather-hour-icon" />;
  }
  if (conditionLower.includes("storm") || conditionLower.includes("tormenta")) {
    return <WiThunderstorm className="weather-hour-icon" />;
  }
  if (conditionLower.includes("snow") || conditionLower.includes("nieve")) {
    return <WiSnow className="weather-hour-icon" />;
  }
  if (conditionLower.includes("cloud") || conditionLower.includes("nublado")) {
    return <WiCloudy className="weather-hour-icon" />;
  }
  return <WiDaySunny className="weather-hour-icon" />;
};

const formatHour = (timestamp: string) => {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const now = new Date();
  
  if (date.getDate() === now.getDate() && 
      date.getMonth() === now.getMonth() && 
      hour === now.getHours()) {
    return "Ahora";
  }
  
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

export default function HourlyForecast({ hourlyData, className }: HourlyForecastProps) {
  return (
    <div className={className}>
      <h3 className="weather-section-title">Próximas 12 horas</h3>
      <div className="weather-hourly-scroll">
        {hourlyData.slice(0, 12).map((hour, index) => (
          <div key={index} className="weather-hour-card">
            <span className="weather-hour-time">
              {formatHour(hour.timestamp)}
            </span>
            {getWeatherIcon(hour.conditionText)}
            <span className="weather-hour-temp">
              {Math.round(hour.temperatureC)}°
            </span>
            {hour.precipitationChance > 0 && (
              <small className="weather-hour-precip">
                {hour.precipitationChance}%
              </small>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
