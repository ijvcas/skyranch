/* 
  Supabase Edge Function: weather-current
  - Input (JSON): { lat: number, lng: number, language?: string, unitSystem?: 'metric' | 'imperial' }
  - Output: { temperatureC, temperatureF, conditionText, precipitationChance, windKph, humidity, raw }
*/
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_WEATHER_API_KEY");
    if (!apiKey) {
      console.error("Missing GOOGLE_WEATHER_API_KEY secret");
      return new Response(JSON.stringify({ error: "Server not configured with GOOGLE_WEATHER_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lat, lng, language = "es", unitSystem = "metric" } = await req.json();
    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(JSON.stringify({ error: "lat and lng are required numbers" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Google Weather API with correct endpoint and parameters
    const apiUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}`;

    console.log("[weather-current] Fetching from Google Weather API:", apiUrl.replace(apiKey, "***"));
    const wxRes = await fetch(apiUrl, {
      method: "GET"
    });
    
    if (!wxRes.ok) {
      const errorText = await wxRes.text();
      console.error("[weather-current] Google Weather API error:", wxRes.status, errorText);
      return new Response(
        JSON.stringify({ error: "Weather API error", status: wxRes.status, details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const data = await wxRes.json();
    console.log("[weather-current] Google Weather API response:", JSON.stringify(data, null, 2));

    // Normalize Google Weather response
    const normalized = normalizeGoogleWeatherData(data);

    return new Response(JSON.stringify({ ...normalized, raw: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[weather-current] Unexpected error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

// Normalize Google Weather response to our standard format
function normalizeGoogleWeatherData(data: any) {
  // Google Weather API response structure
  const temperatureC = data?.temperature?.degrees ? Math.round(data.temperature.degrees) : null;
  const temperatureF = temperatureC ? Math.round((temperatureC * 9) / 5 + 32) : null;
  
  const conditionText = data?.weatherCondition?.description?.text || null;
  
  // Wind speed from m/s to km/h if available
  const windKph = data?.wind?.speed ? Math.round(data.wind.speed * 3.6) : null;
  
  // Humidity as percentage
  const humidity = data?.relativeHumidity ? Math.round(data.relativeHumidity * 100) : null;
  
  // Precipitation probability
  const precipitationChance = data?.precipitationProbability ? 
    Math.round(data.precipitationProbability * 100) : null;

  return {
    temperatureC,
    temperatureF,
    conditionText,
    windKph,
    humidity,
    precipitationChance,
  };
}
