import { WiCloud, WiRain, WiDaySunny, WiSnow, WiCloudy, WiThunderstorm } from "react-icons/wi";
import { DailyForecast } from "@/hooks/useWeatherForecast";

interface TenDayForecastProps {
  data: DailyForecast[];
}

const getWeatherIcon = (condition: string) => {
  const conditionLower = condition.toLowerCase();
  
  // Rain
  if (conditionLower.includes("rain") || conditionLower.includes("lluvia") || 
      conditionLower.includes("drizzle") || conditionLower.includes("llovizna") ||
      conditionLower.includes("shower") || conditionLower.includes("chubasco")) {
    return <WiRain className="weather-day-icon" />;
  }
  
  // Storm
  if (conditionLower.includes("storm") || conditionLower.includes("tormenta") ||
      conditionLower.includes("thunder") || conditionLower.includes("trueno")) {
    return <WiThunderstorm className="weather-day-icon" />;
  }
  
  // Snow
  if (conditionLower.includes("snow") || conditionLower.includes("nieve") ||
      conditionLower.includes("sleet") || conditionLower.includes("aguanieve")) {
    return <WiSnow className="weather-day-icon" />;
  }
  
  // Cloudy (including partial/overcast)
  if (conditionLower.includes("cloud") || conditionLower.includes("nublado") ||
      conditionLower.includes("nube") || conditionLower.includes("overcast") ||
      conditionLower.includes("encapotado") || conditionLower.includes("parcialmente")) {
    return <WiCloudy className="weather-day-icon" />;
  }
  
  // Sunny/Clear
  if (conditionLower.includes("sunny") || conditionLower.includes("soleado") ||
      conditionLower.includes("clear") || conditionLower.includes("despejado")) {
    return <WiDaySunny className="weather-day-icon" />;
  }
  
  // Default to cloudy for unknown conditions
  return <WiCloudy className="weather-day-icon" />;
};

export default function TenDayForecast({ data }: TenDayForecastProps) {
  return (
    <div className="weather-ten-day">
      <h3 className="weather-section-title">Próximos 10 días</h3>
      <div className="weather-frosted-card">
        {data.slice(0, 10).map((day, index) => {
          const date = new Date(day.date);
          const dayName = index === 0 
            ? "Hoy" 
            : date.toLocaleDateString("es-ES", { weekday: "short" }).charAt(0).toUpperCase() + 
              date.toLocaleDateString("es-ES", { weekday: "short" }).slice(1);
          
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
