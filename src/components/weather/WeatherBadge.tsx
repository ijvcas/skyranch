
import React from "react";
import { MapPin, Cloud, Sun, CloudRain, CloudSun } from "lucide-react";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";
import { useFarmWeather } from "@/hooks/useFarmWeather";
import { Skeleton } from "@/components/ui/skeleton";

const pickIcon = (text?: string | null) => {
  const t = (text || "").toLowerCase();
  if (t.includes("lluv") || t.includes("rain")) return CloudRain;
  if (t.includes("nublado") || t.includes("cloud")) return Cloud;
  if (t.includes("parcial") || t.includes("partly")) return CloudSun;
  return Sun;
};

const WeatherBadge: React.FC = () => {
  const { data: settings, isLoading: locLoading } = useWeatherSettings();
  const { data: wx, isLoading: wxLoading } = useFarmWeather(settings?.lat, settings?.lng);

  if (locLoading) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white shadow-sm border">
        <Skeleton className="h-6 w-6 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  const Icon = pickIcon(wx?.conditionText);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white shadow-sm border min-w-[220px]">
      <div className="p-2 rounded-full bg-blue-50 text-blue-600">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col leading-tight">
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span className="truncate max-w-[160px]">{settings.display_name}</span>
        </div>
        <div className="text-base font-medium text-gray-900">
          {wxLoading ? (
            <span className="text-gray-400">Cargando clima…</span>
          ) : wx && wx.temperatureC != null ? (
            <>
              {Math.round(wx.temperatureC)}°C
              {wx.conditionText ? <span className="text-gray-500 ml-1">· {wx.conditionText}</span> : null}
            </>
          ) : (
            <span className="text-gray-400">Sin datos de clima</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherBadge;
