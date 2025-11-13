import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherKitRequest {
  latitude: number;
  longitude: number;
  language?: string;
}

// Generate JWT token for WeatherKit API
async function generateWeatherKitToken(): Promise<string> {
  const teamId = Deno.env.get('APPLE_WEATHERKIT_TEAM_ID');
  const serviceId = Deno.env.get('APPLE_WEATHERKIT_SERVICE_ID');
  const keyId = Deno.env.get('APPLE_WEATHERKIT_KEY_ID');
  const privateKey = Deno.env.get('APPLE_WEATHERKIT_PRIVATE_KEY');

  if (!teamId || !serviceId || !keyId || !privateKey) {
    throw new Error('Missing Apple WeatherKit credentials');
  }

  // Import jose for JWT creation
  const { SignJWT, importPKCS8 } = await import('https://deno.land/x/jose@v5.2.0/index.ts');

  // Prepare the private key
  const formattedKey = privateKey
    .replace(/\\n/g, '\n')
    .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
    .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');

  const cryptoKey = await importPKCS8(formattedKey, 'ES256');

  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId, id: `${teamId}.${serviceId}` })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600) // 1 hour expiration
    .setIssuer(teamId)
    .setSubject(serviceId)
    .sign(cryptoKey);

  return token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Weather Apple function called');

    const { latitude, longitude, language = 'es' }: WeatherKitRequest = await req.json();

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    console.log(`Fetching weather for coordinates: ${latitude}, ${longitude}, language: ${language}`);

    // Generate JWT token
    const token = await generateWeatherKitToken();

    // Call Apple WeatherKit API
    // API documentation: https://developer.apple.com/documentation/weatherkitrestapi
    const weatherUrl = `https://weatherkit.apple.com/api/v1/weather/${language}/${latitude}/${longitude}?dataSets=currentWeather,forecastDaily,forecastHourly&timezone=auto`;

    const weatherResponse = await fetch(weatherUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error('WeatherKit API error:', errorText);
      throw new Error(`WeatherKit API error: ${weatherResponse.status} - ${errorText}`);
    }

    const weatherData = await weatherResponse.json();
    console.log('Weather data fetched successfully');

    // Transform WeatherKit data to match our app's format
    const current = weatherData.currentWeather;
    const daily = weatherData.forecastDaily?.days || [];
    const hourly = weatherData.forecastHourly?.hours || [];

    const transformedData = {
      current: {
        temperature: current.temperature,
        temperatureApparent: current.temperatureApparent,
        humidity: current.humidity * 100, // Convert to percentage
        windSpeed: current.windSpeed,
        windDirection: current.windDirection,
        precipitationIntensity: current.precipitationIntensity,
        precipitationChance: current.precipitationChance,
        pressure: current.pressure,
        uvIndex: current.uvIndex,
        visibility: current.visibility,
        cloudCover: current.cloudCover * 100, // Convert to percentage
        conditionCode: current.conditionCode,
        description: current.conditionCode,
        sunrise: daily[0]?.sunrise,
        sunset: daily[0]?.sunset,
      },
      daily: daily.slice(0, 7).map((day: any) => ({
        date: day.forecastStart,
        temperatureMax: day.temperatureMax,
        temperatureMin: day.temperatureMin,
        precipitationChance: day.precipitationChance * 100,
        precipitationAmount: day.precipitationAmount,
        conditionCode: day.conditionCode,
        sunrise: day.sunrise,
        sunset: day.sunset,
        moonPhase: day.moonPhase,
      })),
      hourly: hourly.slice(0, 24).map((hour: any) => ({
        time: hour.forecastStart,
        temperature: hour.temperature,
        precipitationChance: hour.precipitationChance * 100,
        precipitationIntensity: hour.precipitationIntensity,
        conditionCode: hour.conditionCode,
        windSpeed: hour.windSpeed,
        humidity: hour.humidity * 100,
      })),
      metadata: {
        source: 'Apple WeatherKit',
        latitude,
        longitude,
        language,
        timestamp: new Date().toISOString(),
      },
    };

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in weather-apple function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
