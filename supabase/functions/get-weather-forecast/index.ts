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

// Translate weather conditions to Spanish
function translateCondition(text: string): string {
  if (!text) return 'Desconocido';
  
  const lowerText = text.toLowerCase();
  
  if (/clear|sunny/i.test(lowerText)) return 'Despejado';
  if (/partly cloudy|partly sunny/i.test(lowerText)) return 'Parcialmente nublado';
  if (/cloudy|overcast/i.test(lowerText)) return 'Nublado';
  if (/thunderstorm|storm/i.test(lowerText)) return 'Tormenta';
  if (/heavy rain/i.test(lowerText)) return 'Lluvia intensa';
  if (/rain|rainy|shower/i.test(lowerText)) return 'Lluvia';
  if (/drizzle/i.test(lowerText)) return 'Llovizna';
  if (/snow|snowy/i.test(lowerText)) return 'Nieve';
  if (/fog|mist/i.test(lowerText)) return 'Niebla';
  if (/wind/i.test(lowerText)) return 'Ventoso';
  if (/hail/i.test(lowerText)) return 'Granizo';
  if (/sleet/i.test(lowerText)) return 'Aguanieve';
  
  return text;
}

// Fetch current conditions from Google Weather API
async function fetchCurrentConditions(apiKey: string, lat: number, lng: number, language: string) {
  const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&languageCode=${language}`;
  
  console.log('🌤️ Fetching current conditions from Google Weather API');
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Google Weather API error (current):', errorText);
    throw new Error(`Google Weather API error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

// Fetch daily forecast from Google Weather API
async function fetchDailyForecast(apiKey: string, lat: number, lng: number, language: string, days: number = 10) {
  const url = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&days=${days}&languageCode=${language}`;
  
  console.log(`📅 Fetching ${days}-day forecast from Google Weather API`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Google Weather API error (daily):', errorText);
    throw new Error(`Google Weather API error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

// Fetch hourly forecast from Google Weather API
async function fetchHourlyForecast(apiKey: string, lat: number, lng: number, language: string, hours: number = 48) {
  const url = `https://weather.googleapis.com/v1/forecast/hours:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&hours=${hours}&languageCode=${language}`;
  
  console.log(`⏰ Fetching ${hours}-hour forecast from Google Weather API`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Google Weather API error (hourly):', errorText);
    throw new Error(`Google Weather API error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

// Transform Google Weather API response to our format
function transformGoogleWeatherData(
  currentData: any,
  dailyData: any,
  hourlyData: any,
  lat: number,
  lng: number
): WeatherForecastResponse {
  console.log('🔄 Transforming Google Weather data');
  
  // Transform hourly forecast
  const hourly: HourlyForecast[] = (hourlyData.hourlyForecasts || []).map((hour: any) => {
    const tempC = hour.temperature?.value || 0;
    return {
      timestamp: hour.time || new Date().toISOString(),
      temperatureC: Math.round(tempC),
      temperatureF: Math.round(tempC * 9/5 + 32),
      conditionText: translateCondition(hour.condition?.description || ''),
      windKph: Math.round((hour.wind?.speed?.value || 0) * 3.6), // m/s to km/h
      humidity: hour.relativeHumidity?.value || 0,
      precipitationChance: hour.precipitationProbability?.value || 0,
      precipitationMm: hour.rain?.value || 0
    };
  });
  
  // Transform daily forecast
  const daily: DailyForecast[] = (dailyData.dailyForecasts || []).map((day: any) => {
    const maxTempC = day.temperature?.high?.value || 0;
    const minTempC = day.temperature?.low?.value || 0;
    
    return {
      date: day.date || new Date().toISOString().split('T')[0],
      maxTempC: Math.round(maxTempC),
      minTempC: Math.round(minTempC),
      maxTempF: Math.round(maxTempC * 9/5 + 32),
      minTempF: Math.round(minTempC * 9/5 + 32),
      conditionText: translateCondition(day.condition?.description || ''),
      maxWindKph: Math.round((day.wind?.speed?.value || 0) * 3.6), // m/s to km/h
      avgHumidity: day.relativeHumidity?.value || 0,
      precipitationChance: day.precipitationProbability?.value || 0,
      totalPrecipitationMm: day.rain?.value || 0,
      sunrise: day.sun?.sunrise || '',
      sunset: day.sun?.sunset || ''
    };
  });
  
  console.log(`✅ Transformed ${hourly.length} hourly and ${daily.length} daily forecasts`);
  
  return {
    location: {
      name: currentData.regionCode || 'Unknown',
      lat,
      lng
    },
    daily,
    hourly,
    raw: { currentData, dailyData, hourlyData }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_WEATHER_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_WEATHER_API_KEY not configured');
    }

    const { lat, lng, language = 'es', forecastDays = 10 }: ForecastRequest = await req.json();

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: lat, lng' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🌍 Fetching weather forecast for: ${lat}, ${lng} (${language})`);

    // Fetch all data in parallel
    const [currentData, dailyData, hourlyData] = await Promise.all([
      fetchCurrentConditions(apiKey, lat, lng, language),
      fetchDailyForecast(apiKey, lat, lng, language, forecastDays),
      fetchHourlyForecast(apiKey, lat, lng, language, 48)
    ]);

    // Transform and return the data
    const forecast = transformGoogleWeatherData(currentData, dailyData, hourlyData, lat, lng);

    return new Response(
      JSON.stringify(forecast),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
