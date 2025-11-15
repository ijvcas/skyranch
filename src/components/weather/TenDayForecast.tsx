import { WiCloud, WiRain, WiDaySunny, WiSnow, WiCloudy, WiThunderstorm } from "react-icons/wi";
import { DailyForecast } from "@/hooks/useWeatherForecast";

interface TenDayForecastProps {
  data: DailyForecast[];
}

const getWeatherIcon = (condition: string) => {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes("rain") || conditionLower.includes("lluvia")) {
    return <WiRain className="weather-day-icon" />;
  }
  if (conditionLower.includes("storm") || conditionLower.includes("tormenta")) {
    return <WiThunderstorm className="weather-day-icon" />;
  }
  if (conditionLower.includes("snow") || conditionLower.includes("nieve")) {
    return <WiSnow className="weather-day-icon" />;
  }
  if (conditionLower.includes("cloud") || conditionLower.includes("nublado")) {
    return <WiCloudy className="weather-day-icon" />;
  }
  return <WiDaySunny className="weather-day-icon" />;
};

export default function TenDayForecast({ data }: TenDayForecastProps) {
  return (
    <div className="weather-ten-day">
      <h3 className="weather-section-title">Próximos 10 días</h3>
      <div className="weather-frosted-card">
        {data.map((day, index) => {
          const date = new Date(day.date);
          const dayName = index === 0 
            ? "Hoy" 
            : date.toLocaleDateString("es-ES", { weekday: "short" });
          
          return (
            <div key={day.date} className="weather-day-row">
              <span className="weather-day-name">{dayName}</span>
              {getWeatherIcon(day.conditionText)}
              <div className="weather-temp-bar-container">
                <div 
                  className="weather-temp-bar-gradient"
                  style={{
                    background: `linear-gradient(90deg, hsl(var(--chart-1)) 0%, hsl(var(--chart-2)) 100%)`,
                    width: '100%'
                  }}
                />
              </div>
              <span className="weather-day-temps">
                {Math.round(day.maxTempC)}° / {Math.round(day.minTempC)}°
              </span>
              {day.precipitationChance > 0 && (
                <span className="weather-day-precip">{day.precipitationChance}%</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
