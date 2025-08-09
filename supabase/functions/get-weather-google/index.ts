// Supabase Edge Function: get-weather-google
// - Accepts either a location string or coordinates
// - Geocodes location with Google Maps Geocoding API when needed
// - Fetches current weather from Google Weather API
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

function normalizeGoogleWeatherData(data: any) {
  // Some responses wrap the payload in currentConditions
  const d = data?.currentConditions ? data.currentConditions : data;

  // Temperature
  const deg = d?.temperature?.degrees ?? d?.temperature?.value ?? d?.temperature;
  const tempUnit = d?.temperature?.unit; // 'CELSIUS' | 'FAHRENHEIT' | undefined
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
  const conditionText: string | null =
    d?.weatherCondition?.description?.text ?? d?.phrases?.observation?.long ?? d?.summary ?? null;

  // Wind -> km/h
  const windVal = d?.wind?.speed?.value ?? d?.wind?.speed;
  const windUnit = d?.wind?.speed?.unit; // 'KILOMETERS_PER_HOUR' | 'MILES_PER_HOUR'
  let windKph: number | null = null;
  if (typeof windVal === "number") {
    windKph = windUnit === "MILES_PER_HOUR" ? Math.round(windVal * 1.60934) : Math.round(windVal);
  }

  // Humidity (0-100)
  const humidity =
    typeof d?.relativeHumidity === "number"
      ? Math.round(d.relativeHumidity)
      : typeof d?.humidity?.value === "number"
      ? Math.round(d.humidity.value)
      : null;

  // Precipitation chance (0-100)
  const precipitationChance =
    typeof d?.precipitation?.probability?.percent === "number"
      ? Math.round(d.precipitation.probability.percent)
      : typeof d?.precipitationProbability === "number"
      ? Math.round(d.precipitationProbability * 100)
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

Deno.serve(async (req: Request) => {
  console.log(`[get-weather-google] ${req.method} request received`);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("[get-weather-google] Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[get-weather-google] Processing POST request");
    
    const apiKeyWeather = Deno.env.get("GOOGLE_WEATHER_API_KEY");
    const apiKeyMaps = Deno.env.get("GOOGLE_MAPS_API_KEY");
    
    console.log("[get-weather-google] API Keys status:", {
      weather: apiKeyWeather ? "✓ Present" : "✗ Missing",
      maps: apiKeyMaps ? "✓ Present" : "✗ Missing"
    });

    if (!apiKeyWeather) {
      console.error("[get-weather-google] CRITICAL: Missing GOOGLE_WEATHER_API_KEY");
      return jsonResponse({ error: "Missing weather API key" }, 500);
    }

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    console.log("[get-weather-google] Request body:", body);
    const language = body.language || "es";
    const unitSystem = (body.unitSystem || "metric").toLowerCase() as "metric" | "imperial";

    let lat = typeof body.lat === "number" ? body.lat : undefined;
    let lng = typeof body.lng === "number" ? body.lng : undefined;

    // Geocode if location provided and coords missing
    if ((!lat || !lng) && body.location && apiKeyMaps) {
      try {
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          body.location
        )}&key=${apiKeyMaps}`;
        const geoRes = await fetch(geoUrl);
        const geo = await geoRes.json();
        const loc = geo?.results?.[0]?.geometry?.location;
        if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
          lat = loc.lat;
          lng = loc.lng;
        } else {
          console.warn("[get-weather-google] Geocoding failed for", body.location);
        }
      } catch (e) {
        console.warn("[get-weather-google] Geocoding error", e);
      }
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      console.error("[get-weather-google] No valid coordinates after geocoding:", { lat, lng });
      return jsonResponse({ error: "No valid coordinates" }, 400);
    }

    console.log("[get-weather-google] Using coordinates:", { lat, lng });

    const units = unitSystem === "metric" ? "METRIC" : "IMPERIAL";
    const apiUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKeyWeather}&location.latitude=${lat}&location.longitude=${lng}&languageCode=${encodeURIComponent(
      language
    )}&unitsSystem=${units}`;

    console.log("[get-weather-google] Making Google Weather API call:", apiUrl.replace(apiKeyWeather, "***"));
    
    const wxRes = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
    });
    
    console.log("[get-weather-google] Google Weather API response status:", wxRes.status);
    
    if (!wxRes.ok) {
      const txt = await wxRes.text();
      console.error("[get-weather-google] Google Weather API error:", wxRes.status, txt);
      return jsonResponse({ error: `Weather API error: ${wxRes.status}` }, 500);
    }

    const raw = await wxRes.json();
    console.log("[get-weather-google] Raw weather data:", JSON.stringify(raw, null, 2));
    
    const normalized = normalizeGoogleWeatherData(raw);
    console.log("[get-weather-google] Normalized weather data:", normalized);

    console.log("[get-weather-google] Success! Returning weather data");
    return jsonResponse({ ...normalized, raw });
  } catch (err) {
    console.error("[get-weather-google] Unhandled error", err);
    return jsonResponse(null, 200);
  }
});
