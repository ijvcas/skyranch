import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ForecastRequest {
  lat: number;
  lng: number;
  language?: string;
  forecastDays?: number;
}

interface HourlyForecast {
  timestamp: string;
  temperatureC: number;
  temperatureF: number;
  conditionText: string;
  windKph: number;
  humidity: number;
  precipitationChance: number;
  precipitationMm: number;
}

interface DailyForecast {
  date: string;
  maxTempC: number;
  minTempC: number;
  maxTempF: number;
  minTempF: number;
  conditionText: string;
  maxWindKph: number;
  avgHumidity: number;
  precipitationChance: number;
  totalPrecipitationMm: number;
  sunrise: string;
  sunset: string;
}

interface WeatherForecastResponse {
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  raw?: any;
}

// Generate JWT token for Apple WeatherKit
async function generateWeatherKitToken(): Promise<string> {
  const teamId = Deno.env.get('APPLE_WEATHERKIT_TEAM_ID');
  const serviceId = Deno.env.get('APPLE_WEATHERKIT_SERVICE_ID');
  const keyId = Deno.env.get('APPLE_WEATHERKIT_KEY_ID');
  const privateKey = Deno.env.get('APPLE_WEATHERKIT_PRIVATE_KEY');

  if (!teamId || !serviceId || !keyId || !privateKey) {
    throw new Error('Apple WeatherKit credentials not configured');
  }

  const { SignJWT, importPKCS8 } = await import('https://deno.land/x/jose@v5.2.0/index.ts');

  // Format and import the private key
  const formattedKey = privateKey
    .replace(/\\n/g, '\n')
    .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
    .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');

  const key = await importPKCS8(formattedKey, 'ES256');

  // Create JWT token
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId, id: `${teamId}.${serviceId}` })
    .setIssuedAt()
    .setIssuer(teamId)
    .setSubject(serviceId)
    .setExpirationTime('1h')
    .sign(key);

  return token;
}

// Fetch forecast from Apple WeatherKit
async function fetchWeatherKitForecast(lat: number, lng: number, language: string) {
  const token = await generateWeatherKitToken();

  // Request daily and hourly forecasts
  const weatherUrl = `https://weatherkit.apple.com/api/v1/weather/${language}/${lat}/${lng}?dataSets=currentWeather,forecastDaily,forecastHourly&timezone=auto`;

  const response = await fetch(weatherUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('WeatherKit API error:', errorText);
    throw new Error(`WeatherKit API error: ${response.status}`);
  }

  return await response.json();
}

// Map Apple WeatherKit condition codes to readable text
function mapWeatherKitCondition(code: string): string {
  const conditionMap: Record<string, string> = {
    'Clear': 'Despejado',
    'Cloudy': 'Nublado',
    'MostlyClear': 'Mayormente despejado',
    'MostlyCloudy': 'Mayormente nublado',
    'PartlyCloudy': 'Parcialmente nublado',
    'Rain': 'Lluvia',
    'Drizzle': 'Llovizna',
    'HeavyRain': 'Lluvia fuerte',
    'ScatteredShowers': 'Chubascos dispersos',
    'Showers': 'Chubascos',
    'ScatteredThunderstorms': 'Tormentas dispersas',
    'Thunderstorms': 'Tormentas',
    'IsolatedThunderstorms': 'Tormentas aisladas',
    'SevereThunderstorm': 'Tormenta severa',
    'Thunderstorm': 'Tormenta',
    'Snow': 'Nieve',
    'HeavySnow': 'Nieve fuerte',
    'LightSnow': 'Nieve ligera',
    'Flurries': 'Ráfagas de nieve',
    'SnowShowers': 'Chubascos de nieve',
    'ScatteredSnowShowers': 'Chubascos de nieve dispersos',
    'Sleet': 'Aguanieve',
    'MixedRainAndSleet': 'Lluvia y aguanieve',
    'MixedRainAndSnow': 'Lluvia y nieve',
    'MixedSnowAndSleet': 'Nieve y aguanieve',
    'Hail': 'Granizo',
    'BlowingSnow': 'Nieve voladora',
    'FreezingDrizzle': 'Llovizna helada',
    'FreezingRain': 'Lluvia helada',
    'Blizzard': 'Ventisca',
    'Fog': 'Niebla',
    'Haze': 'Neblina',
    'Smoke': 'Humo',
    'Dust': 'Polvo',
    'Windy': 'Ventoso',
    'Breezy': 'Ventoso',
    'StrongWinds': 'Vientos fuertes',
    'Hurricane': 'Huracán',
    'TropicalStorm': 'Tormenta tropical',
    'Tornado': 'Tornado',
    'Hot': 'Calor extremo',
    'Frigid': 'Frío extremo',
  };

  return conditionMap[code] || code;
}

// Transform Apple WeatherKit data to our format
function transformWeatherKitData(data: any): WeatherForecastResponse {
  const dailyDays = data.forecastDaily?.days || [];
  const hourlyHours = data.forecastHourly?.hours || [];

  return {
    location: {
      name: 'Current Location',
      lat: data.metadata?.latitude || 0,
      lng: data.metadata?.longitude || 0,
    },
    daily: dailyDays.slice(0, 10).map((day: any) => ({
      date: day.forecastStart.split('T')[0],
      maxTempC: Math.round(day.temperatureMax),
      minTempC: Math.round(day.temperatureMin),
      maxTempF: Math.round((day.temperatureMax * 9 / 5) + 32),
      minTempF: Math.round((day.temperatureMin * 9 / 5) + 32),
      conditionText: mapWeatherKitCondition(day.conditionCode),
      maxWindKph: Math.round((day.windSpeedMax || 0) * 3.6), // m/s to km/h
      avgHumidity: Math.round((day.humidity || 0) * 100),
      precipitationChance: Math.round((day.precipitationChance || 0) * 100),
      totalPrecipitationMm: day.precipitationAmount || 0,
      sunrise: day.sunrise || '',
      sunset: day.sunset || '',
    })),
    hourly: hourlyHours.slice(0, 48).map((hour: any) => ({
      timestamp: hour.forecastStart,
      temperatureC: Math.round(hour.temperature),
      temperatureF: Math.round((hour.temperature * 9 / 5) + 32),
      conditionText: mapWeatherKitCondition(hour.conditionCode),
      windKph: Math.round((hour.windSpeed || 0) * 3.6),
      humidity: Math.round((hour.humidity || 0) * 100),
      precipitationChance: Math.round((hour.precipitationChance || 0) * 100),
      precipitationMm: hour.precipitationIntensity || 0,
    })),
    raw: data,
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ForecastRequest = await req.json();
    const { lat, lng, language = 'es', forecastDays = 10 } = body;

    console.log('🌤️ Fetching weather forecast from Apple WeatherKit:', { lat, lng, forecastDays });

    if (!lat || !lng) {
      throw new Error('Location coordinates required');
    }

    // Fetch from Apple WeatherKit
    const weatherData = await fetchWeatherKitForecast(lat, lng, language);

    // Transform to our format
    const response = transformWeatherKitData(weatherData);

    console.log('✅ Weather forecast fetched successfully from Apple WeatherKit');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error fetching weather forecast:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
