import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ForecastRequest {
  location?: string;
  lat?: number;
  lng?: number;
  language?: string;
  unitSystem?: 'metric' | 'imperial';
  forecastDays?: number;
  includeHourly?: boolean;
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_WEATHER_API_KEY');
    if (!apiKey) {
      throw new Error('Google Weather API key not configured');
    }

    const body: ForecastRequest = await req.json();
    const { location, lat, lng, language = 'es', unitSystem = 'metric', forecastDays = 10, includeHourly = true } = body;

    console.log('🌤️ Fetching weather forecast:', { location, lat, lng, forecastDays });

    let latitude = lat;
    let longitude = lng;

    // Geocode if location string provided
    if (location && (!lat || !lng)) {
      const mapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
      if (!mapsApiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${mapsApiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status === 'OK' && geocodeData.results?.[0]?.geometry?.location) {
        latitude = geocodeData.results[0].geometry.location.lat;
        longitude = geocodeData.results[0].geometry.location.lng;
        console.log('📍 Geocoded location:', { latitude, longitude });
      } else {
        throw new Error(`Geocoding failed: ${geocodeData.status}`);
      }
    }

    if (!latitude || !longitude) {
      throw new Error('Location coordinates required');
    }

    // Fetch forecast from Google Weather API
    const weatherUrl = new URL('https://weather.googleapis.com/v1/forecast');
    weatherUrl.searchParams.set('location', `${latitude},${longitude}`);
    weatherUrl.searchParams.set('days', forecastDays.toString());
    weatherUrl.searchParams.set('languageCode', language);
    weatherUrl.searchParams.set('units', unitSystem);
    weatherUrl.searchParams.set('key', apiKey);

    const weatherResponse = await fetch(weatherUrl.toString());

    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error('Google Weather API error:', errorText);
      throw new Error(`Weather API request failed: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    console.log('✅ Weather forecast fetched successfully');

    // Transform data into structured format
    const dailyForecasts: DailyForecast[] = [];
    const hourlyForecasts: HourlyForecast[] = [];

    // Process daily forecasts
    if (weatherData.daily) {
      for (const day of weatherData.daily.slice(0, forecastDays)) {
        dailyForecasts.push({
          date: day.date,
          maxTempC: day.temperature?.max?.celsius || 0,
          minTempC: day.temperature?.min?.celsius || 0,
          maxTempF: day.temperature?.max?.fahrenheit || 0,
          minTempF: day.temperature?.min?.fahrenheit || 0,
          conditionText: day.condition?.description || 'Unknown',
          maxWindKph: day.wind?.max?.speed || 0,
          avgHumidity: day.humidity?.average || 0,
          precipitationChance: day.precipitation?.probability || 0,
          totalPrecipitationMm: day.precipitation?.amount || 0,
          sunrise: day.sunrise || '',
          sunset: day.sunset || '',
        });
      }
    }

    // Process hourly forecasts (next 48 hours)
    if (includeHourly && weatherData.hourly) {
      for (const hour of weatherData.hourly.slice(0, 48)) {
        hourlyForecasts.push({
          timestamp: hour.timestamp,
          temperatureC: hour.temperature?.celsius || 0,
          temperatureF: hour.temperature?.fahrenheit || 0,
          conditionText: hour.condition?.description || 'Unknown',
          windKph: hour.wind?.speed || 0,
          humidity: hour.humidity || 0,
          precipitationChance: hour.precipitation?.probability || 0,
          precipitationMm: hour.precipitation?.amount || 0,
        });
      }
    }

    const response = {
      location: {
        name: weatherData.location?.name || location || 'Unknown',
        lat: latitude,
        lng: longitude,
      },
      daily: dailyForecasts,
      hourly: hourlyForecasts,
      raw: weatherData,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error fetching weather forecast:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
