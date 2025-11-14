import { RichNotificationMetadata, NotificationChartData } from '@/hooks/notifications/types';

interface HourlyForecast {
  timestamp: string;
  temperatureC: number;
  precipitationMm: number;
  precipitationChance: number;
}

interface WeatherAlert {
  type: 'weather';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata: RichNotificationMetadata;
}

export class WeatherSmartAlertBuilder {
  
  // Heavy Rain Forecast Alert
  static buildRainForecastAlert(
    hourlyForecast: HourlyForecast[],
    totalMm: number,
    startTime: Date
  ): WeatherAlert {
    const chartData: NotificationChartData = {
      type: 'bar',
      values: hourlyForecast.slice(0, 12).map(h => h.precipitationMm),
      labels: hourlyForecast.slice(0, 12).map(h => {
        const date = new Date(h.timestamp);
        return `${date.getHours()}h`;
      }),
      color: '#3b82f6',
    };

    return {
      type: 'weather',
      priority: totalMm > 20 ? 'critical' : 'high',
      title: '🌧️ Pronóstico de Lluvia Intensa',
      message: `Se esperan ${totalMm.toFixed(1)}mm de lluvia a partir de las ${startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}. Considere posponer trabajo de campo.`,
      metadata: {
        chartData,
        deepLink: '/weather/forecast',
        actions: [
          {
            id: 'delay_tasks',
            label: 'Posponer Tareas',
            action: 'navigate',
            target: '/tasks?filter=outdoor',
            icon: 'Calendar',
          },
          {
            id: 'view_forecast',
            label: 'Ver Pronóstico',
            action: 'navigate',
            target: '/weather/forecast',
            icon: 'CloudRain',
          },
        ],
      },
    };
  }

  // Frost Warning Alert
  static buildFrostWarningAlert(
    minTemp: number,
    frostStartTime: Date,
    duration: number
  ): WeatherAlert {
    return {
      type: 'weather',
      priority: 'critical',
      title: '❄️ Alerta de Helada',
      message: `Temperatura bajará a ${minTemp.toFixed(1)}°C a las ${frostStartTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}. Proteja cultivos y animales sensibles.`,
      metadata: {
        deepLink: '/weather/forecast',
        actions: [
          {
            id: 'view_animals',
            label: 'Ver Animales',
            action: 'navigate',
            target: '/animals',
            icon: 'Heart',
          },
          {
            id: 'create_protection_task',
            label: 'Crear Tarea Protección',
            action: 'navigate',
            target: '/tasks/new?type=urgent&title=Protección contra helada',
            icon: 'Shield',
          },
          {
            id: 'view_forecast',
            label: 'Ver Pronóstico',
            action: 'navigate',
            target: '/weather/forecast',
            icon: 'Snowflake',
          },
        ],
      },
    };
  }

  // Ideal Conditions Alert
  static buildIdealConditionsAlert(
    activity: 'breeding' | 'field_work' | 'outdoor_activity',
    forecastPeriod: { start: Date; end: Date },
    avgTemp: number
  ): WeatherAlert {
    const activityData = {
      breeding: {
        title: '🐄 Condiciones Ideales para Reproducción',
        message: `Clima perfecto para reproducción: ${avgTemp.toFixed(1)}°C, poco viento, baja probabilidad de lluvia`,
        actions: [
          { id: 'view_breeding', label: 'Registros Reproducción', action: 'navigate' as const, target: '/breeding', icon: 'Heart' },
          { id: 'schedule_breeding', label: 'Programar Reproducción', action: 'navigate' as const, target: '/breeding/new', icon: 'Calendar' },
        ],
      },
      field_work: {
        title: '🚜 Condiciones Ideales para Trabajo de Campo',
        message: `Clima perfecto para trabajo exterior: ${avgTemp.toFixed(1)}°C, condiciones secas`,
        actions: [
          { id: 'view_tasks', label: 'Ver Tareas', action: 'navigate' as const, target: '/tasks', icon: 'List' },
          { id: 'create_task', label: 'Crear Tarea', action: 'navigate' as const, target: '/tasks/new', icon: 'Plus' },
        ],
      },
      outdoor_activity: {
        title: '☀️ Excelente Clima Exterior',
        message: `Condiciones óptimas: ${avgTemp.toFixed(1)}°C, seco y sin viento`,
        actions: [
          { id: 'view_tasks', label: 'Ver Tareas', action: 'navigate' as const, target: '/tasks', icon: 'List' },
        ],
      },
    };

    const data = activityData[activity];

    return {
      type: 'weather',
      priority: 'medium',
      title: data.title,
      message: `${data.message} (${forecastPeriod.start.toLocaleDateString('es-ES')} - ${forecastPeriod.end.toLocaleDateString('es-ES')})`,
      metadata: {
        deepLink: '/weather/forecast',
        actions: [
          ...data.actions,
          {
            id: 'view_forecast',
            label: 'Ver Pronóstico',
            action: 'navigate',
            target: '/weather/forecast',
            icon: 'Sun',
          },
        ],
      },
    };
  }

  // High Wind Warning
  static buildWindWarningAlert(
    maxWindKph: number,
    windTime: Date
  ): WeatherAlert {
    return {
      type: 'weather',
      priority: maxWindKph > 60 ? 'high' : 'medium',
      title: '💨 Alerta de Vientos Fuertes',
      message: `Vientos de hasta ${maxWindKph.toFixed(0)} km/h esperados a las ${windTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}. Asegure equipos y estructuras.`,
      metadata: {
        deepLink: '/weather/forecast',
        actions: [
          {
            id: 'view_forecast',
            label: 'Ver Pronóstico',
            action: 'navigate',
            target: '/weather/forecast',
            icon: 'Wind',
          },
        ],
      },
    };
  }
}
