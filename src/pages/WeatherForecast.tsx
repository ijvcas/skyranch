import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";
import { useWeatherForecast } from "@/hooks/useWeatherForecast";
import { WiDaySunny, WiCloud, WiRain, WiSnow, WiCloudy, WiThunderstorm } from "react-icons/wi";
import CurrentConditions from "@/components/weather/CurrentConditions";
import Recommendations from "@/components/weather/Recommendations";
import HourlyForecast from "@/components/weather/HourlyForecast";
import ForecastChart from "@/components/weather/ForecastChart";
import TenDayForecast from "@/components/weather/TenDayForecast";
import "@/styles/weather.css";

const getWeatherIcon = (condition: string, size: number = 120) => {
  const conditionLower = condition.toLowerCase();
  const style = { fontSize: size, color: "white" };
  
  if (conditionLower.includes("rain") || conditionLower.includes("lluvia")) {
    return <WiRain style={style} />;
  }
  if (conditionLower.includes("storm") || conditionLower.includes("tormenta")) {
    return <WiThunderstorm style={style} />;
  }
  if (conditionLower.includes("snow") || conditionLower.includes("nieve")) {
    return <WiSnow style={style} />;
  }
  if (conditionLower.includes("cloud") || conditionLower.includes("nublado")) {
    return <WiCloudy style={style} />;
  }
  return <WiDaySunny style={style} />;
};

export default function WeatherForecast() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: settings } = useWeatherSettings();
  const { data: forecast, isLoading } = useWeatherForecast(
    settings?.lat,
    settings?.lng,
    'es',
    10
  );

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
  const locationName = settings?.display_name || forecast.location?.name || 'Mi Ubicación';
  const current = forecast.current;
  const dailyHigh = today?.maxTempC || 0;
  const dailyLow = today?.minTempC || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="px-4 pt-safe pt-12 pb-4">
          <button 
            onClick={() => navigate(-1)}
            className="mb-3 text-white dark:text-foreground hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          {/* Location & Current Temp */}
          <div className="text-center text-white dark:text-foreground mb-8">
            <div className="flex items-center justify-center gap-2 text-xl mb-2 opacity-90">
              <span>📍</span>
              <span>{locationName}</span>
            </div>
            <div className="text-7xl font-light tracking-tighter mb-2">
              {today?.maxTempC}°
            </div>
            <div className="text-lg opacity-80">
              {t(`weatherConditions:${detectWeatherCondition(today?.conditionText || '')}`)}
            </div>
            <div className="text-base opacity-70 mt-1">
              H: {today?.maxTempC}° L: {today?.minTempC}°
            </div>
          </div>
        </div>

        {/* Content Cards */}
        <div className="px-4 space-y-6 pb-safe pb-8">
          {/* Hourly Forecast - Horizontal Scroll */}
          {forecast?.hourly && forecast.hourly.length > 0 && (
            <HourlyForecast 
              hourlyData={forecast.hourly}
            />
          )}

          {/* Precipitation Chart - 24 Hours */}
          {precipitationChartData.length > 0 && (
            <ForecastChart
              data={precipitationChartData}
              type="precipitation"
            />
          )}

          {/* Temperature Chart - 24 Hours */}
          {temperatureChartData.length > 0 && (
            <ForecastChart
              data={temperatureChartData}
              type="temperature"
            />
          )}

          {/* 10-Day Forecast */}
          <div className="bg-white/20 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-white/30 dark:border-slate-700/50">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/70 dark:text-foreground/70 mb-3 font-semibold">
              <span className="text-sm">📅</span>
              <span>10-DAY FORECAST</span>
            </div>
            <div className="border-t border-white/20 dark:border-slate-700/50 pt-3">
              <div className="space-y-0">
                {forecast.daily.map((day, idx) => {
                  const isToday = idx === 0;
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-4 py-3 text-white dark:text-foreground ${
                        idx < forecast.daily.length - 1 ? 'border-b border-white/10 dark:border-slate-700/30' : ''
                      }`}
                    >
                      {/* Day Name */}
                      <div className="w-16 shrink-0">
                        <div className="text-base font-medium">
                          {formatDay(day.date, isToday)}
                        </div>
                      </div>
                      
                      {/* Weather Icon */}
                      <div className="flex flex-col items-center w-12 shrink-0">
                        <WeatherIcon 
                          condition={day.conditionText}
                          isDaytime={true}
                          size={32}
                          className="text-white dark:text-foreground"
                        />
                      </div>
                      
                      {/* Rain % */}
                      <div className="w-12 shrink-0">
                        {day.precipitationChance > 0 && (
                          <div className="text-cyan-400 text-base font-semibold">
                            {day.precipitationChance}%
                          </div>
                        )}
                      </div>
                      
                      {/* Temperature Range */}
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-base opacity-60 w-8 text-right font-medium">
                          {day.minTempC}°
                        </span>
                        <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 via-green-400 to-orange-400 rounded-full opacity-80" />
                        <span className="text-lg font-semibold w-9 text-right">
                          {day.maxTempC}°
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherForecast;
