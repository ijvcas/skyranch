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
  feelsLikeC: number;
  feelsLikeF: number;
  conditionText: string;
  conditionCode: string;
  windKph: number;
  windDirection: number | null;
  windCardinal: string | null;
  windGustKph: number | null;
  humidity: number;
  precipitationChance: number;
  precipitationMm: number;
  uvIndex: number | null;
  cloudCover: number | null;
}

interface DailyForecast {
  date: string;
  maxTempC: number;
  minTempC: number;
  maxTempF: number;
  minTempF: number;
  conditionText: string;
  conditionCode: string;
  maxWindKph: number;
  avgHumidity: number;
  precipitationChance: number;
  totalPrecipitationMm: number;
  uvIndex: number | null;
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

// Transform Google Weather API response to our format with full precision
function transformGoogleWeatherData(
  currentData: any,
  dailyData: any,
  hourlyData: any,
  lat: number,
  lng: number
): WeatherForecastResponse {
  console.log('🔄 Transforming Google Weather data with full precision');
  
  // Transform hourly forecast with precision
  const hourly: HourlyForecast[] = (hourlyData.forecastHours || []).map((hour: any) => {
    const tempC = hour.temperature?.degrees ?? 0;
    const feelsLikeC = hour.feelsLike?.degrees ?? hour.apparentTemperature?.degrees ?? tempC;
    const windVal = hour.wind?.speed?.value ?? 0;
    const gustVal = hour.wind?.gust?.value ?? null;
    
    return {
      timestamp: hour.interval?.startTime || new Date().toISOString(),
      temperatureC: Math.round(tempC * 10) / 10,
      temperatureF: Math.round((tempC * 9/5 + 32) * 10) / 10,
      feelsLikeC: Math.round(feelsLikeC * 10) / 10,
      feelsLikeF: Math.round((feelsLikeC * 9/5 + 32) * 10) / 10,
      conditionText: hour.weatherCondition?.description?.text || '',
      conditionCode: hour.weatherCondition?.type || '',
      windKph: Math.round(windVal * 10) / 10,
      windDirection: hour.wind?.direction?.degrees ?? null,
      windCardinal: hour.wind?.direction?.cardinal ?? null,
      windGustKph: gustVal ? Math.round(gustVal * 10) / 10 : null,
      humidity: hour.relativeHumidity ?? 0,
      precipitationChance: hour.precipitation?.probability?.percent ?? 0,
      precipitationMm: Math.round((hour.precipitation?.qpf?.quantity ?? 0) * 10) / 10,
      uvIndex: hour.uvIndex ?? null,
      cloudCover: hour.cloudCover ?? null,
    };
  });
  
  // Transform daily forecast with precision
  const daily: DailyForecast[] = (dailyData.forecastDays || []).map((day: any) => {
    const maxTempC = day.maxTemperature?.degrees ?? 0;
    const minTempC = day.minTemperature?.degrees ?? 0;
    
    return {
      date: day.interval?.startTime || new Date().toISOString().split('T')[0],
      maxTempC: Math.round(maxTempC * 10) / 10,
      minTempC: Math.round(minTempC * 10) / 10,
      maxTempF: Math.round((maxTempC * 9/5 + 32) * 10) / 10,
      minTempF: Math.round((minTempC * 9/5 + 32) * 10) / 10,
      conditionText: day.daytimeForecast?.weatherCondition?.description?.text || '',
      conditionCode: day.daytimeForecast?.weatherCondition?.type || '',
      maxWindKph: Math.round((day.maxWind?.speed?.value ?? 0) * 10) / 10,
      avgHumidity: day.avgRelativeHumidity ?? 0,
      precipitationChance: day.precipitation?.probability?.percent ?? 0,
      totalPrecipitationMm: Math.round((day.precipitation?.totalQpf?.quantity ?? 0) * 10) / 10,
      uvIndex: day.uvIndex ?? null,
      sunrise: day.sunrise || '',
      sunset: day.sunset || ''
    };
  });
  
  console.log(`✅ Transformed ${hourly.length} hourly and ${daily.length} daily forecasts with precision`);
  
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

    const [currentData, dailyData, hourlyData] = await Promise.all([
      fetchCurrentConditions(apiKey, lat, lng, language),
      fetchDailyForecast(apiKey, lat, lng, language, forecastDays),
      fetchHourlyForecast(apiKey, lat, lng, language, 48)
    ]);

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
