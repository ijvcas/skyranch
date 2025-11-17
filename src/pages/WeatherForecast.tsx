import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";
import { useWeatherForecast } from "@/hooks/useWeatherForecast";
import { useFarmWeather } from "@/hooks/useFarmWeather";
import { useWeatherNotifications } from "@/hooks/useWeatherNotifications";
import { WiDaySunny, WiCloud, WiRain, WiSnow, WiCloudy, WiThunderstorm } from "react-icons/wi";
import CurrentConditions from "@/components/weather/CurrentConditions";
import Recommendations from "@/components/weather/Recommendations";
import HourlyForecast from "@/components/weather/HourlyForecast";
import ForecastChart from "@/components/weather/ForecastChart";
import TenDayForecast from "@/components/weather/TenDayForecast";
import "@/styles/weather.css";

const getWeatherIcon = (condition: string, size: number = 120) => {
  const conditionLower = condition.toLowerCase();
  
  // Determine vibrant color based on condition
  let color = "#FFB347"; // Default amber/orange for sunny
  let Icon = WiDaySunny;
  
  // Rain/Drizzle - Blue
  if (conditionLower.includes("rain") || conditionLower.includes("lluvia") ||
      conditionLower.includes("drizzle") || conditionLower.includes("llovizna") ||
      conditionLower.includes("shower") || conditionLower.includes("chubasco")) {
    Icon = WiRain;
    color = "#60A5FA"; // Bright blue
  }
  // Thunderstorm - Purple
  else if (conditionLower.includes("storm") || conditionLower.includes("tormenta")) {
    Icon = WiThunderstorm;
    color = "#A78BFA"; // Purple
  }
  // Snow - Light icy blue
  else if (conditionLower.includes("snow") || conditionLower.includes("nieve")) {
    Icon = WiSnow;
    color = "#BAE6FD"; // Sky blue
  }
  // Cloudy - Light gray
  else if (conditionLower.includes("cloud") || conditionLower.includes("nublado")) {
    Icon = WiCloudy;
    color = "#CBD5E1"; // Slate gray
  }
  // Clear/Sunny - Golden amber
  else {
    Icon = WiDaySunny;
    color = "#FBB040"; // Vibrant amber/gold
  }
  
  return <Icon style={{ fontSize: size, color }} />;
};

export default function WeatherForecast() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: settings } = useWeatherSettings();
  const { data: currentWeather } = useFarmWeather(settings?.lat, settings?.lng, settings?.language || i18n.language);
  const { data: forecast, isLoading } = useWeatherForecast(
    settings?.lat,
    settings?.lng,
    settings?.language || i18n.language,
    10
  );

  // Enable weather notifications for extreme conditions
  useWeatherNotifications(forecast?.daily, !!forecast?.daily);

  const formatHour = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es', { hour: 'numeric', hour12: true });
  };

  // Prepare chart data for precipitation
  const precipitationChartData = forecast?.hourly.slice(0, 24).map(hour => ({
    time: formatHour(hour.timestamp),
    value: hour.precipitationChance
  })) || [];

  // Prepare chart data for temperature
  const temperatureChartData = forecast?.hourly.slice(0, 24).map(hour => ({
    time: formatHour(hour.timestamp),
    value: hour.temperatureC
  })) || [];

  if (isLoading) {
    return (
      <div className="weather-loading-screen">
        <div className="weather-loading-text">Cargando datos meteorológicos…</div>
      </div>
    );
  }

  if (!forecast || !forecast.daily || forecast.daily.length === 0) {
    return (
      <div className="weather-loading-screen">
        <WiCloud style={{ fontSize: 64, color: "white" }} />
        <p className="weather-loading-text">No hay datos meteorológicos disponibles</p>
        <Button
          onClick={() => navigate(-1)}
          variant="secondary"
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  const today = forecast.daily[0];
  const locationName = settings?.display_name || forecast.location?.name || t('weather.noLocation');
  const dailyHigh = today?.maxTempC || 0;
  const dailyLow = today?.minTempC || 0;
  
  // Use current weather for main display
  const displayTemp = currentWeather?.temperatureC ?? today?.maxTempC ?? 0;
  const displayCondition = currentWeather?.conditionText ?? today?.conditionText ?? '';

  return (
    <div className="weather-page">
      {/* Header with gradient background */}
      <header className="weather-header">
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(-1);
          }}
          variant="ghost"
          size="icon"
          className="weather-back-button"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        
        <h2 className="weather-location">{locationName}</h2>
        <div className="weather-main-icon">
          {getWeatherIcon(displayCondition)}
        </div>
        <h1 className="weather-main-temp">{Math.round(displayTemp)}°</h1>
        <p className="weather-condition">{displayCondition}</p>
        <p className="weather-high-low">
          H: {Math.round(dailyHigh)}°  L: {Math.round(dailyLow)}°
        </p>
      </header>

      {/* Content sections */}
      <div className="weather-content">
        {/* Current Conditions Card */}
        <CurrentConditions
          windKph={currentWeather?.windKph ?? null}
          humidity={currentWeather?.humidity ?? null}
          precipitationChance={currentWeather?.precipitationChance ?? null}
          temperatureC={displayTemp}
          high={dailyHigh}
          low={dailyLow}
        />

        {/* Recommendations */}
        <Recommendations
          windKph={currentWeather?.windKph ?? null}
          temperatureC={currentWeather?.temperatureC ?? today.maxTempC}
          precipitationChance={currentWeather?.precipitationChance ?? null}
          dailyForecast={forecast.daily}
        />

        {/* Hourly Forecast */}
        {forecast.hourly && forecast.hourly.length > 0 && (
          <HourlyForecast hourlyData={forecast.hourly} />
        )}

        {/* Precipitation Chart */}
        {precipitationChartData.length > 0 && (
          <ForecastChart 
            data={precipitationChartData} 
            type="precipitation"
          />
        )}
        
        {/* Temperature Chart */}
        {temperatureChartData.length > 0 && (
          <ForecastChart 
            data={temperatureChartData} 
            type="temperature"
          />
        )}

        {/* 5-Day Forecast */}
        <TenDayForecast data={forecast.daily} />
      </div>
    </div>
  );
}
