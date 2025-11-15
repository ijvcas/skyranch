import { useEffect, useRef } from 'react';
import { useNotifications } from './useNotifications';
import { weatherAnalysisService, ExtremeWeatherEvent } from '@/services/weatherAnalysisService';
import { DailyForecast } from './useWeatherForecast';

const NOTIFICATION_STORAGE_KEY = 'weather_notifications_sent';

export const useWeatherNotifications = (
  dailyForecast: DailyForecast[] | undefined,
  enabled: boolean = true
) => {
  const { addNotification } = useNotifications();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !dailyForecast || dailyForecast.length === 0 || hasProcessedRef.current) {
      return;
    }

    // Mark as processed to prevent duplicate runs
    hasProcessedRef.current = true;

    // Analyze forecast for extreme conditions
    const analysis = weatherAnalysisService.analyzeForecast(dailyForecast);

    if (!analysis.hasExtremeConditions) {
      console.log('✅ No extreme weather detected in forecast');
      return;
    }

    // Get previously sent notifications
    const sentNotifications = getSentNotifications();
    const today = new Date().toISOString().split('T')[0];

    // Process only critical and high severity events
    const importantEvents = analysis.events.filter(
      (event) => event.severity === 'critical' || event.severity === 'high'
    );

    importantEvents.forEach((event) => {
      const notificationKey = `${event.type}_${event.date}`;

      // Skip if already notified today
      if (sentNotifications[notificationKey] === today) {
        console.log(`⏭️ Already notified about ${notificationKey}`);
        return;
      }

      // Create notification
      const daysUntil = weatherAnalysisService.getDaysUntil(event.date);
      const formattedDate = weatherAnalysisService.formatDate(event.date);

      createWeatherNotification(event, daysUntil, formattedDate, addNotification);

      // Mark as sent
      sentNotifications[notificationKey] = today;
    });

    // Save updated sent notifications
    saveSentNotifications(sentNotifications);

  }, [dailyForecast, enabled, addNotification]);
};

function createWeatherNotification(
  event: ExtremeWeatherEvent,
  daysUntil: number,
  formattedDate: string,
  addNotification: (notification: any) => void
) {
  const timeframe = daysUntil === 0 
    ? 'hoy' 
    : daysUntil === 1 
    ? 'mañana' 
    : `en ${daysUntil} días`;

  let title = '';
  let message = '';
  let icon = '';

  switch (event.type) {
    case 'heavy_rain':
      icon = '💧';
      title = 'Alerta de Lluvia';
      message = `Lluvia fuerte esperada ${timeframe} (${formattedDate}). Considere posponer actividades al aire libre.`;
      break;
    case 'extreme_heat':
      icon = '🔥';
      title = 'Alerta de Calor Extremo';
      message = `Temperaturas muy altas ${timeframe} (${Math.round(event.value)}°C en ${formattedDate}). Proteja a los animales y evite trabajo pesado.`;
      break;
    case 'freezing':
      icon = '❄️';
      title = 'Alerta de Helada';
      message = `Temperaturas bajo cero ${timeframe} (${Math.round(event.value)}°C en ${formattedDate}). Proteja cultivos y animales del frío.`;
      break;
    case 'strong_wind':
      icon = '🌬️';
      title = 'Alerta de Viento Fuerte';
      message = `Vientos fuertes esperados ${timeframe} (${Math.round(event.value)} km/h en ${formattedDate}). Asegure estructuras y equipo.`;
      break;
  }

  addNotification({
    type: 'warning',
    priority: event.severity,
    title: `${icon} ${title}`,
    message,
    read: false,
    actionRequired: event.severity === 'critical',
    metadata: {
      deepLink: '/weather/forecast',
      actions: [
        {
          id: 'view_forecast',
          label: 'Ver Pronóstico',
          action: 'navigate',
          target: '/weather/forecast',
          icon: 'eye'
        }
      ]
    }
  });

  console.log(`📬 Weather notification created: ${title} - ${message}`);
}

function getSentNotifications(): Record<string, string> {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveSentNotifications(notifications: Record<string, string>) {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notification state:', error);
  }
}
