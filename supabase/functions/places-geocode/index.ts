/*
  Supabase Edge Function: places-geocode
  - Input (JSON): { query: string, language?: string }
  - Output: {
      ok: boolean,
      query: string,
      result?: {
        place_id: string,
        display_name: string,
        lat: number,
        lng: number,
        types?: string[]
      },
      error?: string,
      raw?: any
    }
*/
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      return json({ ok: false, error: "Missing GOOGLE_MAPS_API_KEY" }, 500);
    }

    const { query, language = "es" } = await req.json();
    if (!query || typeof query !== "string") {
      return json({ ok: false, error: "query is required" }, 400);
    }

    // Use Geocoding API to resolve free-text city into coordinates
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", query);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", language);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      return json({ ok: false, error: `Geocode upstream ${res.status}` , raw: data }, 502);
    }

    const result = (data.results && data.results[0]) || null;
    if (!result) {
      return json({ ok: false, error: "No results found", query, raw: data }, 404);
    }

    const loc = result.geometry?.location;
    if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
      return json({ ok: false, error: "Invalid geocode result", query, raw: result }, 502);
    }

    const display_name = result.formatted_address || query;
    const place_id = result.place_id || "";

    // Optionally verify the result is city-like
    const types: string[] = result.types || [];
    const isCityLike = types.includes("locality") || types.includes("postal_town") || types.includes("administrative_area_level_1") || types.includes("administrative_area_level_2");

    return json({
      ok: true,
      query,
      result: {
        place_id,
        display_name,
        lat: loc.lat,
        lng: loc.lng,
        types,
      },
      raw: data,
    });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
