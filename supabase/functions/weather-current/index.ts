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

    // Use OpenWeatherMap API instead of Google Weather (which is not publicly available)
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=${language}`;

    console.log("[weather-current] Fetching from OpenWeatherMap:", apiUrl.replace(apiKey, "***"));
    const wxRes = await fetch(apiUrl);
    const data = await wxRes.json();

    if (!wxRes.ok) {
      console.error("[weather-current] OpenWeatherMap error:", wxRes.status, data);
      return new Response(
        JSON.stringify({ error: "Weather API error", status: wxRes.status, details: data }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize OpenWeatherMap response
    const normalized = normalizeOpenWeatherMapData(data);

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

// Normalize OpenWeatherMap response to our standard format
function normalizeOpenWeatherMapData(data: any) {
  const temperatureC = data?.main?.temp ? Math.round(data.main.temp) : null;
  const temperatureF = temperatureC ? Math.round((temperatureC * 9) / 5 + 32) : null;
  const conditionText = data?.weather?.[0]?.description || null;
  const windKph = data?.wind?.speed ? Math.round(data.wind.speed * 3.6) : null; // m/s to km/h
  const humidity = data?.main?.humidity || null;
  const precipitationChance = null; // OpenWeatherMap doesn't provide this in current weather

  return {
    temperatureC,
    temperatureF,
    conditionText,
    windKph,
    humidity,
    precipitationChance,
  };
}
