import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeatherSettings } from '@/hooks/useWeatherSettings';
import { useWeatherForecast } from '@/hooks/useWeatherForecast';
import { 
  Wind, Droplets, Snowflake, CloudRain,
  AlertCircle, ArrowLeft,
  Calendar, Heart, List
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WeatherIcon, getWeatherIconColor } from '@/components/weather/WeatherIcon';
import { detectWeatherCondition } from '@/utils/weatherTranslation';

const WeatherForecast = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['weather', 'weatherConditions']);
  const { data: settings } = useWeatherSettings();
  const { data: forecast, isLoading, error } = useWeatherForecast(
    settings?.lat,
    settings?.lng,
    'es',
    10
  );

  const formatHour = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:00`;
  };

  const formatDate = (dateStr: string, short: boolean = false) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return short ? 'Today' : t('weather:forecast.today');
    if (date.toDateString() === tomorrow.toDateString()) return short ? 'Tomorrow' : t('weather:forecast.tomorrow');
    
    const locale = i18n.language || 'es';
    if (short) {
      return date.toLocaleDateString(locale, { weekday: 'short' });
    }
    return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const isHourDaytime = (timestamp: string) => {
    const hour = new Date(timestamp).getHours();
    return hour >= 6 && hour < 20;
  };

  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 20;

  // Generate recommendations based on forecast
  const generateRecommendations = () => {
    if (!forecast?.daily) return [];
    
    const recommendations = [];
    const nextThreeDays = forecast.daily.slice(0, 3);
    const totalRain = nextThreeDays.reduce((sum, day) => sum + day.totalPrecipitationMm, 0);
    
    if (totalRain > 20) {
      recommendations.push({
        id: 'delay-field-work',
        icon: Calendar,
        title: t('weather:forecast.delayFieldWork'),
        message: `${totalRain.toFixed(1)}${t('weather:forecast.heavyRainExpected')}`,
        action: '/tasks?filter=outdoor',
        actionLabel: 'Ver Tareas',
        severity: 'high',
        color: 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20',
        iconColor: 'text-red-600',
      });
    }
    
    const frostDays = forecast.daily.filter(day => day.minTempC < 0);
    if (frostDays.length > 0) {
      recommendations.push({
        id: 'frost-protection',
        icon: Snowflake,
        title: t('weather:forecast.frostProtection'),
        message: `${t('weather:forecast.tempsBelowZero')} ${formatDate(frostDays[0].date)}. ${t('weather:forecast.ensureShelters')}`,
        action: '/animals',
        actionLabel: 'Ver Animales',
        severity: 'critical',
        color: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20',
        iconColor: 'text-blue-600',
      });
    }
    
    const idealDays = forecast.daily.filter(day => 
      day.maxTempC >= 18 && 
      day.maxTempC <= 25 && 
      day.precipitationChance < 30 &&
      day.maxWindKph < 20
    );
    if (idealDays.length >= 2) {
      recommendations.push({
        id: 'ideal-breeding',
        icon: Heart,
        title: t('weather:forecast.idealConditions'),
        message: `${t('weather:forecast.perfectWeather')} ${idealDays.length} ${t('weather:forecast.daysFrom')} ${formatDate(idealDays[0].date)}`,
        action: '/breeding',
        actionLabel: 'Ver Reproducción',
        severity: 'positive',
        color: 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20',
        iconColor: 'text-green-600',
      });
    }
    
    return recommendations;
  };

  const recommendations = generateRecommendations();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  // No data state
  if (!forecast || !forecast.daily || forecast.daily.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Pronóstico Extendido</h1>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sin datos de pronóstico</AlertTitle>
          <AlertDescription>
            Configure las coordenadas del clima en ajustes para ver el pronóstico.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const today = forecast.daily[0];
  const hourlyNext24 = forecast.hourly.slice(0, 24);

  // Prepare chart data
  const tempChartData = hourlyNext24.map(hour => ({
    time: formatHour(hour.timestamp),
    temp: hour.temperatureC,
  }));

  const precipChartData = hourlyNext24.map(hour => ({
    time: formatHour(hour.timestamp),
    precip: hour.precipitationChance,
  }));

  // Dynamic color based on temperature
  const avgTemp = tempChartData.reduce((sum, d) => sum + d.temp, 0) / tempChartData.length;
  const tempColor = avgTemp < 10 ? 'hsl(210, 100%, 50%)' : avgTemp > 25 ? 'hsl(15, 100%, 50%)' : 'hsl(var(--primary))';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-8">
      <div className="max-w-lg mx-auto px-3 pt-3 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-9 w-9 p-0 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{t('weather:forecast.extendedTitle')}</h1>
            <p className="text-xs text-muted-foreground">{t('weather:forecast.nextDays')}</p>
          </div>
        </div>

        {/* Current Conditions */}
        <Card className="rounded-3xl border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur p-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <WeatherIcon 
                condition={today?.conditionText || 'Clear'}
                isDaytime={isDaytime}
                size={64}
                className={getWeatherIconColor(today?.conditionText || '')}
              />
              <div className="text-center">
                <div className="text-5xl font-bold tracking-tight">{today?.maxTempC}°</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t(`weatherConditions:${detectWeatherCondition(today?.conditionText || '')}`)}
                </div>
              </div>
            </div>
          </div>
            
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <Droplets className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <div className="text-xs text-muted-foreground">{t('weather:forecast.humidity')}</div>
              <div className="text-sm font-semibold">{today?.avgHumidity}%</div>
            </div>
            <div className="text-center">
              <Wind className="h-4 w-4 mx-auto mb-1 text-cyan-500" />
              <div className="text-xs text-muted-foreground">{t('weather:forecast.wind')}</div>
              <div className="text-sm font-semibold">{today?.maxWindKph}</div>
            </div>
            <div className="text-center">
              <CloudRain className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <div className="text-xs text-muted-foreground">{t('weather:forecast.rain')}</div>
              <div className="text-sm font-semibold">{today?.precipitationChance}%</div>
            </div>
            <div className="text-center">
              <div className="h-4 w-4 mx-auto mb-1 text-xs">🌡️</div>
              <div className="text-xs text-muted-foreground">{t('weather:forecast.min')}</div>
              <div className="text-sm font-semibold">{today?.minTempC}°</div>
            </div>
          </div>
        </Card>

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <Card className="rounded-3xl border-0 shadow-sm bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <List className="h-4 w-4" />
                {t('weather:forecast.recommendationsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {recommendations.map(rec => (
                <div 
                  key={rec.id} 
                  className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${rec.color}`}
                  onClick={() => navigate(rec.action)}
                >
                  <rec.icon className={`h-5 w-5 mt-0.5 shrink-0 ${rec.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{rec.title}</div>
                    <div className="text-xs mt-0.5 opacity-90">{rec.message}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Hourly Forecast */}
        <Card className="rounded-3xl border-0 shadow-sm bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('weather:forecast.hourlyForecast')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                {forecast.hourly.slice(0, 24).map((hour, idx) => (
                  <div key={idx} className="flex flex-col items-center min-w-[60px]">
                    <div className="text-xs text-muted-foreground mb-1">{formatHour(hour.timestamp)}</div>
                    <WeatherIcon 
                      condition={hour.conditionText}
                      isDaytime={isHourDaytime(hour.timestamp)}
                      size={32}
                      className={getWeatherIconColor(hour.conditionText)}
                    />
                    <div className="font-semibold text-sm mt-1">{hour.temperatureC}°</div>
                    <div className="text-[10px] text-blue-500">☔ {hour.precipitationChance}%</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Temperature Chart */}
        <Card className="rounded-3xl border-0 shadow-sm bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('weather:forecast.temperature24h')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 -mx-2">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={tempChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="temp" stroke={tempColor} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Precipitation Chart */}
        <Card className="rounded-3xl border-0 shadow-sm bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('weather:forecast.precipitation24h')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 -mx-2">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={precipChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="precip" fill="hsl(210, 100%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 10-Day Forecast - iOS Style */}
        <Card className="rounded-3xl border-0 shadow-sm bg-card/50 backdrop-blur overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold tracking-tight">
              {t('weather:forecast.next10Days')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-4 pb-4">
            <div className="space-y-0">
              {forecast.daily.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-4 py-3 ${idx < forecast.daily.length - 1 ? 'border-b border-border/20' : ''}`}
                >
                  {/* Day Name */}
                  <div className="w-20 shrink-0">
                    <div className="text-lg font-semibold">
                      {formatDate(day.date, true)}
                    </div>
                  </div>
                  
                  {/* Weather Icon + Rain % */}
                  <div className="flex flex-col items-center w-16 shrink-0">
                    <WeatherIcon 
                      condition={day.conditionText}
                      isDaytime={true}
                      size={40}
                      className="text-foreground"
                    />
                    {day.precipitationChance > 0 && (
                      <div className="text-base text-cyan-400 font-semibold mt-0.5">
                        {day.precipitationChance}%
                      </div>
                    )}
                  </div>
                  
                  {/* Temperature Range */}
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className="text-lg text-muted-foreground/80 w-9 text-right">
                      {day.minTempC}°
                    </span>
                    <div className="w-20 h-1.5 bg-gradient-to-r from-cyan-400 via-teal-400 to-orange-400 rounded-full" />
                    <span className="text-xl font-bold w-11 text-right">
                      {day.maxTempC}°
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WeatherForecast;
