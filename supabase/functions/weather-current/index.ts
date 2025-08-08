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

    // Try Google Maps Platform Weather - Current Conditions
    // Endpoint may evolve; we attempt a canonical form and surface error body if it fails.
    const url = new URL("https://weather.googleapis.com/v1/currentConditions:lookup");
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("languageCode", language);
    // unitSystem may be 'metric' or 'imperial' depending on API; keep to pass-through
    url.searchParams.set("unitSystem", unitSystem);

    console.log("[weather-current] Fetching:", url.toString());
    const wxRes = await fetch(url.toString(), { method: "GET" });
    const text = await wxRes.text();

    if (!wxRes.ok) {
      console.error("[weather-current] Upstream error:", wxRes.status, text);
      return new Response(
        JSON.stringify({ error: "Weather API error", status: wxRes.status, details: safeJson(text) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = safeJson(text);
    // Normalize a few common fields if present
    const normalized = normalizeGoogleWeather(data);

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

// Attempt to map Google Weather response to a simpler shape
function normalizeGoogleWeather(input: any) {
  // Common plausible shapes based on Google Weather docs (subject to change):
  // - input.currentConditions?.temperature?.value/units
  // - input.currentConditions?.temperatureCelsius
  // - input.currentConditions?.weatherCode? or .summary?
  const cc = input?.currentConditions || input?.current_conditions || input?.data || input;
  let temperatureC: number | null = null;
  let temperatureF: number | null = null;
  let conditionText: string | null = null;
  let windKph: number | null = null;
  let humidity: number | null = null;
  let precipitationChance: number | null = null;

  // Temperature
  if (cc?.temperature?.value != null && typeof cc?.temperature?.value === "number") {
    const val = cc.temperature.value;
    const units = (cc.temperature.units || "").toLowerCase();
    if (units.includes("c")) {
      temperatureC = val;
      temperatureF = Math.round((val * 9) / 5 + 32);
    } else if (units.includes("f")) {
      temperatureF = val;
      temperatureC = Math.round(((val - 32) * 5) / 9);
    }
  } else if (typeof cc?.temperatureCelsius === "number") {
    temperatureC = cc.temperatureCelsius;
    temperatureF = Math.round((cc.temperatureCelsius * 9) / 5 + 32);
  }

  // Condition summary string
  conditionText = cc?.weatherDescription || cc?.summary || cc?.conditionText || cc?.weather || null;

  // Humidity
  if (typeof cc?.humidity === "number") {
    humidity = cc.humidity; // assume %
  }

  // Wind
  if (cc?.windSpeed?.value != null && typeof cc?.windSpeed?.value === "number") {
    const units = (cc?.windSpeed?.units || "").toLowerCase();
    if (units.includes("kph") || units.includes("km/h") || units.includes("kmh")) {
      windKph = cc.windSpeed.value;
    } else if (units.includes("m/s")) {
      windKph = Math.round(cc.windSpeed.value * 3.6);
    } else if (units.includes("mph")) {
      windKph = Math.round(cc.windSpeed.value * 1.60934);
    }
  }

  // Precipitation chance
  if (typeof cc?.precipitationChance === "number") {
    precipitationChance = cc.precipitationChance;
  }

  return {
    temperatureC,
    temperatureF,
    conditionText,
    windKph,
    humidity,
    precipitationChance,
  };
}
