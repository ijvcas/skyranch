/*
  Supabase Edge Function: places-details
  - Input (JSON): { place_id: string, language?: string }
  - Output: {
      ok: boolean,
      place_id: string,
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

    const { place_id, language = "es" } = await req.json();
    if (!place_id || typeof place_id !== "string") {
      return json({ ok: false, error: "place_id is required" }, 400);
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", place_id);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", language);
    url.searchParams.set("fields", "place_id,formatted_address,geometry,types,name");

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      return json({ ok: false, error: `Details upstream ${res.status}`, raw: data, place_id }, 502);
    }

    const result = data.result || null;
    if (!result) {
      return json({ ok: false, error: "No details found", raw: data, place_id }, 404);
    }

    const loc = result.geometry?.location;
    if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
      return json({ ok: false, error: "Invalid details result", raw: result, place_id }, 502);
    }

    const payload = {
      place_id: result.place_id || place_id,
      display_name: result.formatted_address || result.name || "",
      lat: loc.lat,
      lng: loc.lng,
      types: result.types || [],
    };

    return json({ ok: true, place_id, result: payload, raw: data });
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
