import { supabase } from '@/integrations/supabase/client';

export interface LocationSuggestion {
  description: string;
  place_id: string;
  types?: string[];
}

export interface LocationResult {
  place_id: string;
  display_name: string;
  lat: number;
  lng: number;
  types?: string[];
}

export const searchLocations = async (input: string, language = 'es'): Promise<LocationSuggestion[]> => {
  if (!input || input.trim().length < 3) return [];
  
  const { data, error } = await supabase.functions.invoke('places-autocomplete', {
    body: { input, language },
  });

  if (error) {
    console.error('Location search error:', error);
    return [];
  }

  if (!data?.ok) {
    console.warn('Location search not ok:', data);
    return [];
  }

  return (data.predictions || []) as LocationSuggestion[];
};

export const validateLocation = async (place_id: string, language = 'es'): Promise<LocationResult | null> => {
  const { data, error } = await supabase.functions.invoke('places-details', {
    body: { place_id, language },
  });

  if (error) {
    console.error('Location validation error:', error);
    return null;
  }

  if (!data?.ok || !data?.result) {
    console.warn('Location validation failed:', data);
    return null;
  }

  return data.result as LocationResult;
};

export const geocodeLocation = async (query: string, language = 'es'): Promise<LocationResult | null> => {
  const { data, error } = await supabase.functions.invoke('places-geocode', {
    body: { query, language },
  });

  if (error) {
    console.error('Geocoding error:', error);
    return null;
  }

  if (!data?.ok || !data?.result) {
    console.warn('Geocoding failed:', data);
    return null;
  }

  return data.result as LocationResult;
};