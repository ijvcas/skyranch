/*
  Supabase Edge Function: places-autocomplete
  - Input (JSON): { input: string, language?: string }
  - Output: {
      ok: boolean,
      input: string,
      predictions?: Array<{ description: string; place_id: string; types?: string[] }>,
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

    const { input, language = "es" } = await req.json();
    if (!input || typeof input !== "string") {
      return json({ ok: false, error: "input is required" }, 400);
    }

    const isSpanish = (typeof language === "string" && language.toLowerCase().startsWith("es")) || /\b(espa(?:n|ñ)a|spain)\b/i.test(input);

    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", input);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", language);
    url.searchParams.set("types", "geocode");
    if (isSpanish) {
      url.searchParams.set("components", "country:es");
    }

    console.log('[places-autocomplete] request', { input, language, isSpanish, url: url.toString() });
    const res = await fetch(url.toString());
    const data = await res.json();
    console.log('[places-autocomplete] response', { status: res.status, google_status: data.status, error_message: data.error_message });

    if (!res.ok) {
      return json({ ok: false, error: `Autocomplete upstream ${res.status}`, raw: data, input }, 502);
    }

    const predictions = (data.predictions || []).map((p: any) => ({
      description: p.description as string,
      place_id: p.place_id as string,
      types: p.types as string[] | undefined,
    }));

    return json({ ok: true, input, predictions, raw: data });
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
