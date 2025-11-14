import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useWeatherSettings } from '@/hooks/useWeatherSettings';
import { useWeatherForecast } from '@/hooks/useWeatherForecast';
import { useFarmWeather } from '@/hooks/useFarmWeather';
import { 
  CloudRain, Sun, CloudSun, Cloud, Wind, Droplets, 
  AlertCircle, ArrowLeft, Snowflake, CloudDrizzle,
  Calendar, Heart, List, Loader2
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WeatherForecast = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['weather', 'weatherConditions']);
  const { data: settings } = useWeatherSettings();
  const { data: currentWeather, isLoading: currentLoading } = useFarmWeather(
    settings?.lat,
    settings?.lng,
    'es'
  );
  const { data: forecast, isLoading: forecastLoading } = useWeatherForecast(
    settings?.lat,
    settings?.lng,
    'es',
    10
  );

  const isLoading = currentLoading || forecastLoading;

  const getWeatherIcon = (condition: string) => {
    const text = condition.toLowerCase();
    if (/lluvi|rain|pluie|chuva/.test(text)) return CloudRain;
    if (/tormenta|thunderstorm|orage/.test(text)) return CloudRain;
    if (/nieve|snow|neige|neve/.test(text)) return Snowflake;
    if (/nubla|cloud|nuage/.test(text)) return CloudSun;
    if (/despejado|clear|dégagé|limpo/.test(text)) return Sun;
    if (/soleado|sunny|ensoleillé/.test(text)) return Sun;
    if (/viento|wind|venteux/.test(text)) return Wind;
    if (/llovizna|drizzle|bruine|garoa/.test(text)) return CloudDrizzle;
    return Cloud;
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando pronóstico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pronóstico del Tiempo</h1>
            <p className="text-muted-foreground">{settings?.display_name || 'Mi Ubicación'}</p>
          </div>
        </div>

        {/* Current Conditions */}
        {currentWeather && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {React.createElement(getWeatherIcon(currentWeather.conditionText || ''), {
                    className: 'h-20 w-20 text-primary',
                  })}
                  <div>
                    <div className="text-6xl font-bold">{currentWeather.temperatureC?.toFixed(0)}°C</div>
                    <div className="text-2xl text-muted-foreground capitalize">{currentWeather.conditionText}</div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2 justify-end">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <span>{currentWeather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Wind className="h-5 w-5 text-slate-500" />
                    <span>{currentWeather.windKph} km/h</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <CloudRain className="h-5 w-5 text-blue-400" />
                    <span>{currentWeather.precipitationChance}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hourly Forecast */}
        {forecast?.hourly && forecast.hourly.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Próximas 48 Horas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {forecast.hourly.slice(0, 48).map((hour, index) => {
                    const WeatherIcon = getWeatherIcon(hour.conditionText);
                    return (
                      <div key={index} className="flex flex-col items-center min-w-[80px] p-3 rounded-lg hover:bg-muted transition-colors">
                        <div className="text-sm text-muted-foreground font-medium">
                          {formatHour(hour.timestamp)}
                        </div>
                        <WeatherIcon className="h-8 w-8 my-2 text-primary" />
                        <div className="font-semibold text-lg">{hour.temperatureC.toFixed(0)}°</div>
                        <div className="text-xs text-blue-500 mt-1">☔ {hour.precipitationChance}%</div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Temperature Chart */}
        {forecast?.hourly && forecast.hourly.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Temperatura</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={forecast.hourly.slice(0, 24)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatHour}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperatureC" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Temperatura (°C)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Precipitation Chart */}
        {forecast?.hourly && forecast.hourly.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pronóstico de Precipitación</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={forecast.hourly.slice(0, 24)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatHour}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar 
                    dataKey="precipitationMm" 
                    fill="hsl(var(--chart-1))"
                    name="Precipitación (mm)" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 10-Day Forecast */}
        {forecast?.daily && forecast.daily.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pronóstico de 10 Días</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {forecast.daily.map((day, index) => {
                  const WeatherIcon = getWeatherIcon(day.conditionText);
                  return (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-muted transition-colors border border-border"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-sm font-medium w-24">{formatDate(day.date)}</div>
                        <WeatherIcon className="h-8 w-8 text-primary" />
                        <div className="text-sm flex-1 capitalize">{day.conditionText}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-sm">
                          <span className="font-semibold text-red-500">{day.maxTempC.toFixed(0)}°</span>
                          <span className="text-muted-foreground mx-1">/</span>
                          <span className="text-blue-500">{day.minTempC.toFixed(0)}°</span>
                        </div>
                        <div className="text-sm text-blue-500 w-16 text-right">
                          ☔ {day.precipitationChance}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones Inteligentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div 
                    key={rec.id} 
                    className="flex items-start gap-3 p-4 bg-muted rounded-lg border border-border"
                  >
                    <rec.icon className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{rec.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{rec.message}</div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(rec.action)}
                      className="flex-shrink-0"
                    >
                      {rec.actionLabel}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WeatherForecast;
