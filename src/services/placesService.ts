import { supabase } from '@/integrations/supabase/client';

export interface GeocodeResult {
  place_id: string;
  display_name: string;
  lat: number;
  lng: number;
  types?: string[];
}

export interface PlacePrediction {
  description: string;
  place_id: string;
  types?: string[];
}

export const geocodeCity = async (query: string, language = 'es'): Promise<GeocodeResult | null> => {
  const { data, error } = await supabase.functions.invoke('places-geocode', {
    body: { query, language },
  });

  if (error) {
    console.error('places-geocode error:', error);
    return null;
  }

  if (!data?.ok || !data?.result) {
    console.warn('No geocode result for query', query, data);
    return null;
  }

  const r = data.result;
  return {
    place_id: r.place_id,
    display_name: r.display_name,
    lat: r.lat,
    lng: r.lng,
    types: r.types,
  } as GeocodeResult;
};

export const suggestPlaces = async (input: string, language = 'es'): Promise<PlacePrediction[]> => {
  if (!input || input.trim().length < 3) return [];
  const { data, error } = await supabase.functions.invoke('places-autocomplete', {
    body: { input, language },
  });
  if (error) {
    console.error('places-autocomplete error:', error);
    return [];
  }
  if (!data?.ok) {
    console.warn('places-autocomplete not ok', data);
    return [];
  }
  return (data.predictions || []) as PlacePrediction[];
};

export const getPlaceDetails = async (place_id: string, language = 'es'): Promise<GeocodeResult | null> => {
  const { data, error } = await supabase.functions.invoke('places-details', {
    body: { place_id, language },
  });
  if (error) {
    console.error('places-details error:', error);
    return null;
  }
  if (!data?.ok || !data?.result) return null;
  const r = data.result;
  return {
    place_id: r.place_id,
    display_name: r.display_name,
    lat: r.lat,
    lng: r.lng,
    types: r.types,
  } as GeocodeResult;
};