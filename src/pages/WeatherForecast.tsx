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

const WeatherForecast = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['weather', 'weatherConditions']);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === tomorrow.toDateString()) return 'Mañana';
    
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
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
        title: 'Posponer Trabajo de Campo',
        message: `${totalRain.toFixed(1)}mm de lluvia esperados en próximos 3 días. Reprograme tareas exteriores.`,
        action: '/tasks?filter=outdoor',
        actionLabel: 'Ver Tareas',
      });
    }
    
    const frostDays = forecast.daily.filter(day => day.minTempC < 0);
    if (frostDays.length > 0) {
      recommendations.push({
        id: 'frost-protection',
        icon: Snowflake,
        title: 'Protección Contra Heladas',
        message: `Temperaturas bajo cero esperadas el ${formatDate(frostDays[0].date)}. Asegure refugios.`,
        action: '/animals',
        actionLabel: 'Ver Animales',
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
        title: 'Condiciones Ideales',
        message: `Clima perfecto por ${idealDays.length} días desde ${formatDate(idealDays[0].date)}`,
        action: '/breeding',
        actionLabel: 'Ver Reproducción',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 pb-20">
      <div className="container mx-auto space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pronóstico Extendido</h1>
            <p className="text-sm text-muted-foreground">Próximos 10 días</p>
          </div>
        </div>

        {/* Current Conditions */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <WeatherIcon 
                condition={today?.conditionText || 'Clear'}
                isDaytime={isDaytime}
                size={80}
                className={getWeatherIconColor(today?.conditionText || '')}
              />
              <div>
                <div className="text-5xl font-bold">{today?.maxTempC}°C</div>
                <div className="text-xl text-muted-foreground">{today?.conditionText}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Humedad</div>
                  <div className="font-semibold">{today?.avgHumidity}%</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-cyan-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Viento</div>
                  <div className="font-semibold">{today?.maxWindKph} km/h</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Lluvia</div>
                  <div className="font-semibold">{today?.precipitationChance}%</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Recomendaciones Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map(rec => (
                <Alert key={rec.id} className="cursor-pointer hover:bg-muted" onClick={() => navigate(rec.action)}>
                  <rec.icon className="h-4 w-4" />
                  <AlertTitle>{rec.title}</AlertTitle>
                  <AlertDescription>{rec.message}</AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Hourly Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Pronóstico por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-4">
                {forecast.hourly.map((hour, idx) => (
                  <div key={idx} className="flex flex-col items-center min-w-[80px]">
                    <div className="text-sm text-muted-foreground">{formatHour(hour.timestamp)}</div>
                    <WeatherIcon 
                      condition={hour.conditionText}
                      isDaytime={isHourDaytime(hour.timestamp)}
                      size={40}
                      className={getWeatherIconColor(hour.conditionText)}
                    />
                    <div className="font-semibold">{hour.temperatureC}°</div>
                    <div className="text-xs text-blue-500">☔ {hour.precipitationChance}%</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Temperature Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Temperatura - Próximas 24 Horas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tempChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Precipitation Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Probabilidad de Precipitación - 24 Horas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={precipChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="precip" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 10-Day Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Pronóstico de 10 Días</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {forecast.daily.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-sm font-medium w-24">{formatDate(day.date)}</div>
                    <WeatherIcon 
                      condition={day.conditionText}
                      isDaytime={true}
                      size={40}
                      className={getWeatherIconColor(day.conditionText)}
                    />
                    <div className="text-sm flex-1">{day.conditionText}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{day.minTempC}°</span>
                    <div className="w-20 h-2 bg-gradient-to-r from-blue-200 to-orange-400 rounded-full" />
                    <span className="text-sm font-semibold">{day.maxTempC}°</span>
                  </div>
                  <div className="text-xs text-blue-500 ml-4">☔ {day.precipitationChance}%</div>
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
