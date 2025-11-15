import { DailyForecast } from '@/hooks/useWeatherForecast';

export interface ExtremeWeatherEvent {
  type: 'heavy_rain' | 'extreme_heat' | 'freezing' | 'strong_wind';
  date: string;
  severity: 'critical' | 'high' | 'medium';
  value: number;
  description: string;
}

export interface WeatherAnalysis {
  hasExtremeConditions: boolean;
  events: ExtremeWeatherEvent[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
}

// Thresholds for extreme weather detection
const THRESHOLDS = {
  HEAVY_RAIN: 70, // %
  MODERATE_RAIN: 50, // %
  EXTREME_HEAT: 32, // °C
  HIGH_HEAT: 28, // °C
  FREEZING: 0, // °C
  COLD: 5, // °C
  STRONG_WIND: 40, // km/h
  MODERATE_WIND: 25, // km/h
};

export class WeatherAnalysisService {
  /**
   * Analyzes the 10-day forecast for extreme weather conditions
   */
  analyzeForecast(dailyForecast: DailyForecast[]): WeatherAnalysis {
    const events: ExtremeWeatherEvent[] = [];

    dailyForecast.forEach((day) => {
      // Check for heavy rain
      if (day.precipitationChance > THRESHOLDS.HEAVY_RAIN) {
        events.push({
          type: 'heavy_rain',
          date: day.date,
          severity: 'critical',
          value: day.precipitationChance,
          description: `Heavy rain (${day.precipitationChance}% chance)`,
        });
      } else if (day.precipitationChance > THRESHOLDS.MODERATE_RAIN) {
        events.push({
          type: 'heavy_rain',
          date: day.date,
          severity: 'medium',
          value: day.precipitationChance,
          description: `Rain likely (${day.precipitationChance}% chance)`,
        });
      }

      // Check for extreme heat
      if (day.maxTempC > THRESHOLDS.EXTREME_HEAT) {
        events.push({
          type: 'extreme_heat',
          date: day.date,
          severity: 'critical',
          value: day.maxTempC,
          description: `Extreme heat (${Math.round(day.maxTempC)}°C)`,
        });
      } else if (day.maxTempC > THRESHOLDS.HIGH_HEAT) {
        events.push({
          type: 'extreme_heat',
          date: day.date,
          severity: 'high',
          value: day.maxTempC,
          description: `High temperature (${Math.round(day.maxTempC)}°C)`,
        });
      }

      // Check for freezing temperatures
      if (day.minTempC < THRESHOLDS.FREEZING) {
        events.push({
          type: 'freezing',
          date: day.date,
          severity: 'critical',
          value: day.minTempC,
          description: `Freezing (${Math.round(day.minTempC)}°C)`,
        });
      } else if (day.minTempC < THRESHOLDS.COLD) {
        events.push({
          type: 'freezing',
          date: day.date,
          severity: 'medium',
          value: day.minTempC,
          description: `Cold weather (${Math.round(day.minTempC)}°C)`,
        });
      }

      // Check for strong wind
      if (day.maxWindKph > THRESHOLDS.STRONG_WIND) {
        events.push({
          type: 'strong_wind',
          date: day.date,
          severity: 'critical',
          value: day.maxWindKph,
          description: `Strong wind (${Math.round(day.maxWindKph)} km/h)`,
        });
      } else if (day.maxWindKph > THRESHOLDS.MODERATE_WIND) {
        events.push({
          type: 'strong_wind',
          date: day.date,
          severity: 'high',
          value: day.maxWindKph,
          description: `Moderate wind (${Math.round(day.maxWindKph)} km/h)`,
        });
      }
    });

    // Sort by severity and date
    events.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return {
      hasExtremeConditions: events.length > 0,
      events,
      criticalCount: events.filter((e) => e.severity === 'critical').length,
      highCount: events.filter((e) => e.severity === 'high').length,
      mediumCount: events.filter((e) => e.severity === 'medium').length,
    };
  }

  /**
   * Formats a date string to a readable format
   */
  formatDate(dateString: string, language: string = 'es'): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    };
    return date.toLocaleDateString(language, options);
  }

  /**
   * Gets days until an event
   */
  getDaysUntil(dateString: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateString);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const weatherAnalysisService = new WeatherAnalysisService();
