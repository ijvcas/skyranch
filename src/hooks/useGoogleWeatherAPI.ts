import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CurrentWeather } from "@/services/googleWeatherService";

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const useGoogleWeatherAPI = (location?: string) => {
  console.log("🌤️ [useGoogleWeatherAPI] Hook called with location:", location);
  
  return useQuery<CurrentWeather | null>({
    queryKey: ["google-weather", location],
    queryFn: async () => {
      console.log("🌤️ [useGoogleWeatherAPI] Query function executing for:", location);
      
      if (!location || typeof location !== "string" || location.trim().length === 0) {
        console.log("🌤️ [useGoogleWeatherAPI] Invalid location, returning null");
        return null;
      }

      const key = `weather:${location}`;
      const now = Date.now();

      // 1) Try fresh cache first
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.ts && now - parsed.ts < CACHE_TTL && parsed?.data) {
            console.log("🌤️ [useGoogleWeatherAPI] cache hit", { key, ageMs: now - parsed.ts });
            return parsed.data as CurrentWeather;
          }
        }
      } catch (e) {
        console.warn("🌤️ [useGoogleWeatherAPI] cache read failed", e);
      }

      // 2) Fetch from Google Weather Edge Function
      console.log("🌤️ [useGoogleWeatherAPI] Calling get-weather-google with:", { 
        location: location.trim(),
        language: "es", 
        unitSystem: "metric" 
      });
      
      let data: CurrentWeather | null = null;
      
      // First attempt: Using Supabase client
      try {
        console.log("🌤️ [useGoogleWeatherAPI] Invoking supabase.functions.invoke...");
        const { data: functionData, error } = await supabase.functions.invoke("get-weather-google", {
          body: { 
            location: location.trim(),
            language: "es", 
            unitSystem: "metric" 
          },
        });
        
        console.log("🌤️ [useGoogleWeatherAPI] Edge function response:", { functionData, error });
        
        if (error) {
          console.error("🌤️ [useGoogleWeatherAPI] Supabase invoke error:", error);
          throw new Error(`Supabase invoke failed: ${error.message}`);
        } else if (functionData) {
          data = functionData as CurrentWeather;
          console.log("🌤️ [useGoogleWeatherAPI] SUCCESS: Got real weather data:", data);
        }
      } catch (supabaseError) {
        console.error("🌤️ [useGoogleWeatherAPI] Supabase call failed, trying direct HTTP:", supabaseError);
        
        // Second attempt: Direct HTTP call to Edge Function
        try {
          const directUrl = `https://ahwhtxygyzoadsmdrwwg.supabase.co/functions/v1/get-weather-google`;
          console.log("🌤️ [useGoogleWeatherAPI] Attempting direct HTTP call to:", directUrl);
          
          const response = await fetch(directUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFod2h0eHlneXpvYWRzbWRyd3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMjIxNzMsImV4cCI6MjA2NDY5ODE3M30.rffEqABIU3U7e7qdPXLvNMQfqU2sNIJHrfP_A_5GrlI`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFod2h0eHlneXpvYWRzbWRyd3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMjIxNzMsImV4cCI6MjA2NDY5ODE3M30.rffEqABIU3U7e7qdPXLvNMQfqU2sNIJHrfP_A_5GrlI'
            },
            body: JSON.stringify({ 
              location: location.trim(),
              language: "es", 
              unitSystem: "metric" 
            }),
          });
          
          console.log("🌤️ [useGoogleWeatherAPI] Direct HTTP response status:", response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("🌤️ [useGoogleWeatherAPI] Direct HTTP error:", errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          const directData = await response.json();
          console.log("🌤️ [useGoogleWeatherAPI] Direct HTTP SUCCESS:", directData);
          data = directData as CurrentWeather;
          
        } catch (httpError) {
          console.error("🌤️ [useGoogleWeatherAPI] BOTH methods failed:", httpError);
          throw httpError;
        }
      }

      if (data && (data.temperatureC != null || data.conditionText != null)) {
        try {
          localStorage.setItem(key, JSON.stringify({ ts: now, data }));
        } catch (e) {
          console.warn("🌤️ [useGoogleWeatherAPI] cache write failed", e);
        }
        console.log("🌤️ [useGoogleWeatherAPI] fetch success, cached and returning REAL weather data");
        return data;
      }

      // 3) Fallback: Use stale cache if available
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data) {
            console.log("🌤️ [useGoogleWeatherAPI] using stale cached weather due to fetch failure");
            return parsed.data as CurrentWeather;
          }
        }
      } catch (_) {}

      // 4) NO MORE MOCK FALLBACK - FORCE THE ERROR TO BE VISIBLE
      console.error("🌤️ [useGoogleWeatherAPI] CRITICAL: All weather data sources failed - no mock fallback");
      throw new Error("Failed to fetch weather data from all sources. Check API keys and network connectivity.");
    },
    enabled: typeof location === "string" && location.trim().length > 0,
    staleTime: CACHE_TTL,
    retry: 1,
  });
};
