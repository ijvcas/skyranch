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
    const units = unitSystem === "metric" ? "METRIC" : "IMPERIAL";
    const apiUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&languageCode=${encodeURIComponent(language)}&unitsSystem=${units}`;

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
  // Temperature
  const deg = data?.temperature?.degrees;
  const tempUnit = data?.temperature?.unit; // 'CELSIUS' | 'FAHRENHEIT'
  let temperatureC: number | null = null;
  let temperatureF: number | null = null;
  if (typeof deg === "number") {
    if (tempUnit === "FAHRENHEIT") {
      temperatureF = Math.round(deg);
      temperatureC = Math.round(((deg - 32) * 5) / 9);
    } else {
      temperatureC = Math.round(deg);
      temperatureF = Math.round((deg * 9) / 5 + 32);
    }
  }

  // Condition text
  const conditionText: string | null = data?.weatherCondition?.description?.text ?? null;

  // Wind -> km/h
  const windVal = data?.wind?.speed?.value;
  const windUnit = data?.wind?.speed?.unit; // 'KILOMETERS_PER_HOUR' | 'MILES_PER_HOUR'
  let windKph: number | null = null;
  if (typeof windVal === "number") {
    windKph = windUnit === "MILES_PER_HOUR" ? Math.round(windVal * 1.60934) : Math.round(windVal);
  }

  // Humidity (0-100 integer)
  const humidity = typeof data?.relativeHumidity === "number" ? data.relativeHumidity : null;

  // Precipitation chance (0-100)
  const precipitationChance = typeof data?.precipitation?.probability?.percent === "number"
    ? data.precipitation.probability.percent
    : null;

  return {
    temperatureC,
    temperatureF,
    conditionText,
    windKph,
    humidity,
    precipitationChance,
  };
}
