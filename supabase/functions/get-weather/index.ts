// Supabase Edge Function: get-weather
// - Uses OpenWeatherMap as a secondary weather source
// - Accepts either a location string or coordinates
// - Returns normalized weather data with CORS enabled

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  location?: string;
  lat?: number;
  lng?: number;
  language?: string; // e.g. 'es'
  unitSystem?: "metric" | "imperial"; // default metric
}

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeOpenWeather(data: any, unitSystem: "metric" | "imperial") {
  const main = data?.main || {};
  const weather0 = Array.isArray(data?.weather) ? data.weather[0] : undefined;
  const wind = data?.wind || {};

  let temperatureC: number | null = null;
  let temperatureF: number | null = null;

  if (typeof main.temp === "number") {
    if (unitSystem === "imperial") {
      temperatureF = Math.round(main.temp);
      temperatureC = Math.round(((main.temp - 32) * 5) / 9);
    } else {
      temperatureC = Math.round(main.temp);
      temperatureF = Math.round((main.temp * 9) / 5 + 32);
    }
  }

  const conditionText: string | null = weather0?.description ?? null;

  let windKph: number | null = null;
  if (typeof wind.speed === "number") {
    // OpenWeather: m/s for metric, mph for imperial
    windKph = unitSystem === "imperial" ? Math.round(wind.speed * 1.60934) : Math.round(wind.speed * 3.6);
  }

  const humidity = typeof main.humidity === "number" ? Math.round(main.humidity) : null;

  // OpenWeather current weather doesn't provide probability of precipitation
  const precipitationChance: number | null = null;

  return { temperatureC, temperatureF, conditionText, windKph, humidity, precipitationChance };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
    if (!apiKey) {
      console.warn("[get-weather] Missing OPENWEATHER_API_KEY");
      return jsonResponse(null, 200);
    }

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const language = body.language || "es";
    const unitSystem = (body.unitSystem || "metric").toLowerCase() as "metric" | "imperial";

    let url: string | null = null;
    if (body.location) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        body.location
      )}&appid=${apiKey}&lang=${encodeURIComponent(language)}&units=${unitSystem}`;
    } else if (typeof body.lat === "number" && typeof body.lng === "number") {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${body.lat}&lon=${body.lng}&appid=${apiKey}&lang=${encodeURIComponent(
        language
      )}&units=${unitSystem}`;
    }

    if (!url) {
      console.warn("[get-weather] No location or coordinates provided");
      return jsonResponse(null, 200);
    }

    console.log("[get-weather] Fetch:", url.replace(apiKey, "***"));
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const txt = await res.text();
      console.warn("[get-weather] OpenWeather non-200", res.status, txt);
      return jsonResponse(null, 200);
    }

    const raw = await res.json();
    const normalized = normalizeOpenWeather(raw, unitSystem);
    return jsonResponse({ ...normalized, raw });
  } catch (err) {
    console.error("[get-weather] Unhandled error", err);
    return jsonResponse(null, 200);
  }
});
