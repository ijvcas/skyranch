import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { HourlyForecast as HourlyForecastType } from '@/hooks/useWeatherForecast';

interface HourlyForecastProps {
  hourlyData: HourlyForecastType[];
  className?: string;
}

export const HourlyForecast = ({ hourlyData, className = '' }: HourlyForecastProps) => {
  const formatHour = (timestamp: string) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Show next 12 hours from current time
  const next12Hours = hourlyData.slice(0, 12);

  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">
          Hourly Forecast
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Next 12 hours</p>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {next12Hours.map((hour, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-3 min-w-[70px] bg-background/20 backdrop-blur-md rounded-2xl p-4 border border-border/20 hover:bg-background/30 transition-all duration-300 shadow-sm"
            >
              {/* Time */}
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                {index === 0 ? 'Now' : formatHour(hour.timestamp)}
              </span>

              {/* Weather Icon */}
              <div className="w-10 h-10 flex items-center justify-center">
                <WeatherIcon 
                  condition={hour.conditionText} 
                  size={32}
                  className="drop-shadow-md"
                />
              </div>

              {/* Precipitation */}
              {hour.precipitationChance > 0 && (
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3 text-[hsl(200,100%,60%)]"
                    fill="currentColor"
                    viewBox="0 0 12 16"
                  >
                    <path d="M6 0C4.5 2.5 0 8 0 11c0 3.3 2.7 6 6 6s6-2.7 6-6c0-3-4.5-8.5-6-11z" />
                  </svg>
                  <span className="text-xs font-medium text-[hsl(200,100%,60%)]">
                    {hour.precipitationChance}%
                  </span>
                </div>
              )}

              {/* Temperature */}
              <span className="text-lg font-bold text-foreground">
                {Math.round(hour.temperatureC)}°
              </span>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-2" />
      </ScrollArea>
    </div>
  );
};
