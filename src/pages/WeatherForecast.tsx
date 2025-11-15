import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useWeatherSettings } from '@/hooks/useWeatherSettings';
import { useWeatherForecast } from '@/hooks/useWeatherForecast';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { detectWeatherCondition } from '@/utils/weatherTranslation';

const WeatherForecast = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['weather', 'weatherConditions']);
  const { data: settings } = useWeatherSettings();
  const { data: forecast, isLoading } = useWeatherForecast(
    settings?.lat,
    settings?.lng,
    i18n.language || 'es',
    10
  );

  const formatHour = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    return hours === 0 ? 'Now' : `${hours}`;
  };

  const formatDay = (dateStr: string, isToday: boolean) => {
    if (isToday) return 'Today';
    const date = new Date(dateStr);
    const locale = i18n.language || 'en';
    return date.toLocaleDateString(locale, { weekday: 'short' });
  };

  const isHourDaytime = (timestamp: string) => {
    const hour = new Date(timestamp).getHours();
    return hour >= 6 && hour < 20;
  };

  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 20;


  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
          <div className="text-center text-foreground/60 text-sm">Loading weather...</div>
        </div>
      </div>
    );
  }

  // No data state
  if (!forecast || !forecast.daily || forecast.daily.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button 
            onClick={() => navigate(-1)}
            className="mb-6 text-white dark:text-foreground"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="text-center text-foreground/60">
            No weather data available. Please configure your location in settings.
          </div>
        </div>
      </div>
    );
  }

  const today = forecast.daily[0];
  const locationName = settings?.display_name || forecast.location.name || 'Current Location';

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
        <div className="px-4 space-y-4 pb-safe pb-8">
          {/* Hourly Forecast */}
          <div className="bg-white/20 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-white/30 dark:border-slate-700/50">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/70 dark:text-foreground/70 mb-3 font-semibold">
              <span className="text-sm">🕐</span>
              <span>HOURLY FORECAST</span>
            </div>
            <div className="border-t border-white/20 dark:border-slate-700/50 pt-3">
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {forecast.hourly.slice(0, 24).map((hour, idx) => {
                  const hourTime = formatHour(hour.timestamp);
                  return (
                    <div key={idx} className="flex flex-col items-center min-w-[50px] text-white dark:text-foreground">
                      <div className="text-sm font-medium mb-2 opacity-90">
                        {hourTime}
                      </div>
                      <WeatherIcon 
                        condition={hour.conditionText}
                        isDaytime={isHourDaytime(hour.timestamp)}
                        size={36}
                        className="text-white dark:text-foreground mb-2"
                      />
                      {hour.precipitationChance > 0 && (
                        <div className="text-cyan-400 text-sm font-semibold mb-1">
                          {hour.precipitationChance}%
                        </div>
                      )}
                      <div className="text-lg font-medium">
                        {hour.temperatureC}°
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

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
