// Supabase Edge Function: get-weather-google
// - Accepts either a location string or coordinates
// - Geocodes location with Google Maps Geocoding API when needed
// - Fetches current weather from Google Weather API
// - Returns normalized weather data with CORS enabled and full precision
// Updated: 2025-12-08 - Enhanced precision

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [get-weather-google] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

interface RequestBody {
  location?: string;
  lat?: number;
  lng?: number;
  language?: string;
  unitSystem?: "metric" | "imperial";
}

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeGoogleWeatherData(data: any) {
  const d = data?.currentConditions ? data.currentConditions : data;

  // Temperature - keep decimal precision
  const deg = d?.temperature?.degrees ?? d?.temperature?.value ?? d?.temperature;
  const tempUnit = d?.temperature?.unit;
  let temperatureC: number | null = null;
  let temperatureF: number | null = null;
  if (typeof deg === "number") {
    if (tempUnit === "FAHRENHEIT") {
      temperatureF = Math.round(deg * 10) / 10;
      temperatureC = Math.round(((deg - 32) * 5 / 9) * 10) / 10;
    } else {
      temperatureC = Math.round(deg * 10) / 10;
      temperatureF = Math.round((deg * 9 / 5 + 32) * 10) / 10;
    }
  }

  // Feels like temperature
  const feelsLikeDeg = d?.feelsLike?.degrees ?? d?.apparentTemperature?.degrees ?? d?.apparentTemperature?.value;
  let feelsLikeC: number | null = null;
  let feelsLikeF: number | null = null;
  if (typeof feelsLikeDeg === "number") {
    if (tempUnit === "FAHRENHEIT") {
      feelsLikeF = Math.round(feelsLikeDeg * 10) / 10;
      feelsLikeC = Math.round(((feelsLikeDeg - 32) * 5 / 9) * 10) / 10;
    } else {
      feelsLikeC = Math.round(feelsLikeDeg * 10) / 10;
      feelsLikeF = Math.round((feelsLikeDeg * 9 / 5 + 32) * 10) / 10;
    }
  }

  // Condition text - keep original from API
  const conditionText: string | null =
    d?.weatherCondition?.description?.text ?? d?.phrases?.observation?.long ?? d?.summary ?? null;
  
  // Condition code for icon selection
  const conditionCode: string | null = d?.weatherCondition?.type ?? null;

  // Wind - keep decimal precision
  const windVal = d?.wind?.speed?.value ?? d?.wind?.speed;
  const windUnit = d?.wind?.speed?.unit;
  let windKph: number | null = null;
  if (typeof windVal === "number") {
    windKph = windUnit === "MILES_PER_HOUR" 
      ? Math.round(windVal * 1.60934 * 10) / 10 
      : Math.round(windVal * 10) / 10;
  }

  // Wind direction
  const windDirection = d?.wind?.direction?.degrees ?? d?.wind?.direction ?? null;
  const windCardinal = d?.wind?.direction?.cardinal ?? null;

  // Wind gusts
  const gustVal = d?.wind?.gust?.value ?? d?.wind?.gustSpeed?.value;
  let windGustKph: number | null = null;
  if (typeof gustVal === "number") {
    windGustKph = windUnit === "MILES_PER_HOUR"
      ? Math.round(gustVal * 1.60934 * 10) / 10
      : Math.round(gustVal * 10) / 10;
  }

  // Humidity (0-100)
  const humidity =
    typeof d?.relativeHumidity === "number"
      ? d.relativeHumidity
      : typeof d?.humidity?.value === "number"
      ? d.humidity.value
      : null;

  // Precipitation chance (0-100)
  const precipitationChance =
    typeof d?.precipitation?.probability?.percent === "number"
      ? d.precipitation.probability.percent
      : typeof d?.precipitationProbability === "number"
      ? Math.round(d.precipitationProbability * 100)
      : null;

  // Precipitation amount in mm
  const precipitationMm = d?.precipitation?.qpf?.quantity ?? d?.precipitation?.amount ?? null;

  // UV Index
  const uvIndex = d?.uvIndex ?? d?.uvHealthConcern?.value ?? null;

  // Visibility in km
  const visibilityVal = d?.visibility?.distance ?? d?.visibility?.value ?? d?.visibility;
  const visibilityUnit = d?.visibility?.unit;
  let visibilityKm: number | null = null;
  if (typeof visibilityVal === "number") {
    visibilityKm = visibilityUnit === "MILES"
      ? Math.round(visibilityVal * 1.60934 * 10) / 10
      : Math.round(visibilityVal * 10) / 10;
  }

  // Pressure in hPa
  const pressureVal = d?.pressure?.value ?? d?.barometricPressure?.value;
  const pressureUnit = d?.pressure?.unit ?? d?.barometricPressure?.unit;
  let pressureHpa: number | null = null;
  if (typeof pressureVal === "number") {
    pressureHpa = pressureUnit === "INCH_OF_MERCURY"
      ? Math.round(pressureVal * 33.8639 * 10) / 10
      : Math.round(pressureVal * 10) / 10;
  }

  // Dew point
  const dewPointVal = d?.dewPoint?.degrees ?? d?.dewPoint?.value;
  let dewPointC: number | null = null;
  if (typeof dewPointVal === "number") {
    dewPointC = Math.round(dewPointVal * 10) / 10;
  }

  // Cloud cover percentage
  const cloudCover = d?.cloudCover ?? d?.cloudiness ?? null;

  return {
    temperatureC,
    temperatureF,
    feelsLikeC,
    feelsLikeF,
    conditionText,
    conditionCode,
    windKph,
    windDirection,
    windCardinal,
    windGustKph,
    humidity,
    precipitationChance,
    precipitationMm,
    uvIndex,
    visibilityKm,
    pressureHpa,
    dewPointC,
    cloudCover,
  };
}

Deno.serve(async (req: Request) => {
  console.log(`[get-weather-google] ${req.method} request received`);
  
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
