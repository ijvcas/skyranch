import { supabase } from '@/integrations/supabase/client';

export interface AppleWeatherCurrent {
  temperature: number;
  temperatureApparent: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitationIntensity: number;
  precipitationChance: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
  cloudCover: number;
  conditionCode: string;
  description: string;
  sunrise?: string;
  sunset?: string;
}

export interface AppleWeatherDaily {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationChance: number;
  precipitationAmount: number;
  conditionCode: string;
  sunrise: string;
  sunset: string;
  moonPhase: string;
}

export interface AppleWeatherHourly {
  time: string;
  temperature: number;
  precipitationChance: number;
  precipitationIntensity: number;
  conditionCode: string;
  windSpeed: number;
  humidity: number;
}

export interface AppleWeatherResponse {
  current: AppleWeatherCurrent;
  daily: AppleWeatherDaily[];
  hourly: AppleWeatherHourly[];
  metadata: {
    source: string;
    latitude: number;
    longitude: number;
    language: string;
    timestamp: string;
  };
}

export class AppleWeatherService {
  async getCurrentWeather(
    latitude: number,
    longitude: number,
    language: string = 'es'
  ): Promise<AppleWeatherResponse> {
    try {
      console.log('Calling Apple WeatherKit for coordinates:', { latitude, longitude, language });

      const { data, error } = await supabase.functions.invoke('weather-apple', {
        body: { latitude, longitude, language },
      });

      if (error) {
        console.error('Error calling weather-apple function:', error);
        throw new Error(`Failed to fetch weather data: ${error.message}`);
      }

      if (!data) {
        throw new Error('No weather data returned from API');
      }

      console.log('Apple WeatherKit data received successfully');
      return data as AppleWeatherResponse;
    } catch (error) {
      console.error('Error in AppleWeatherService:', error);
      throw error;
    }
  }

  // Helper method to get weather condition description in Spanish
  getConditionDescription(conditionCode: string): string {
    const conditions: Record<string, string> = {
      'Clear': 'Despejado',
      'Cloudy': 'Nublado',
      'Dust': 'Polvo',
      'Fog': 'Niebla',
      'Haze': 'Neblina',
      'MostlyClear': 'Mayormente despejado',
      'MostlyCloudy': 'Mayormente nublado',
      'PartlyCloudy': 'Parcialmente nublado',
      'ScatteredThunderstorms': 'Tormentas dispersas',
      'Smoke': 'Humo',
      'Breezy': 'Ventoso',
      'Windy': 'Muy ventoso',
      'Drizzle': 'Llovizna',
      'HeavyRain': 'Lluvia fuerte',
      'Rain': 'Lluvia',
      'Showers': 'Chubascos',
      'Flurries': 'Ráfagas de nieve',
      'HeavySnow': 'Nieve fuerte',
      'MixedRainAndSleet': 'Lluvia y aguanieve',
      'MixedRainAndSnow': 'Lluvia y nieve',
      'MixedRainfall': 'Precipitación mixta',
      'MixedSnowAndSleet': 'Nieve y aguanieve',
      'ScatteredShowers': 'Chubascos dispersos',
      'ScatteredSnowShowers': 'Chubascos de nieve dispersos',
      'Sleet': 'Aguanieve',
      'Snow': 'Nieve',
      'SnowShowers': 'Chubascos de nieve',
      'Blizzard': 'Ventisca',
      'BlowingSnow': 'Nieve voladora',
      'FreezingDrizzle': 'Llovizna helada',
      'FreezingRain': 'Lluvia helada',
      'Frigid': 'Frío extremo',
      'Hail': 'Granizo',
      'Hot': 'Calor extremo',
      'Hurricane': 'Huracán',
      'IsolatedThunderstorms': 'Tormentas aisladas',
      'SevereThunderstorm': 'Tormenta severa',
      'Thunderstorm': 'Tormenta',
      'Tornado': 'Tornado',
      'TropicalStorm': 'Tormenta tropical',
    };

    return conditions[conditionCode] || conditionCode;
  }

  // Helper method to format temperature
  formatTemperature(celsius: number, unit: 'C' | 'F' = 'C'): string {
    if (unit === 'F') {
      const fahrenheit = (celsius * 9) / 5 + 32;
      return `${Math.round(fahrenheit)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  }

  // Helper method to check if conditions are suitable for field work
  isGoodForFieldWork(weather: AppleWeatherCurrent): boolean {
    return (
      weather.precipitationChance < 30 &&
      weather.windSpeed < 25 &&
      weather.temperature > 5 &&
      weather.temperature < 35
    );
  }
}

export const appleWeatherService = new AppleWeatherService();
