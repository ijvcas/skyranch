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

interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  importance: number;
  class: string;
  type: string;
}

export const searchLocations = async (input: string, language = 'es'): Promise<LocationSuggestion[]> => {
  if (!input || input.trim().length < 3) return [];
  
  try {
    const params = new URLSearchParams({
      q: input,
      format: 'json',
      limit: '5',
      'accept-language': language,
      addressdetails: '1'
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        'User-Agent': 'SkyRanch Farm Management App'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const results: NominatimResult[] = await response.json();
    
    return results.map(result => ({
      description: result.display_name,
      place_id: result.place_id,
      types: [result.class, result.type]
    }));
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
};

export const validateLocation = async (place_id: string, language = 'es'): Promise<LocationResult | null> => {
  try {
    console.log('🗺️ Validating location with place_id:', place_id);
    
    const params = new URLSearchParams({
      osm_ids: place_id,
      format: 'json',
      'accept-language': language,
      addressdetails: '1'
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/lookup?${params}`, {
      headers: {
        'User-Agent': 'SkyRanch Farm Management App'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const results: NominatimResult[] = await response.json();
    
    console.log('🗺️ Validation results:', results);
    
    if (results.length === 0) {
      console.log('🗺️ No validation results found for place_id:', place_id);
      return null;
    }

    const result = results[0];
    
    console.log('🗺️ Validation successful:', result);
    
    return {
      place_id: result.place_id,
      display_name: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      types: [result.class, result.type]
    };
  } catch (error) {
    console.error('🗺️ Location validation error:', error);
    return null;
  }
};

export const geocodeLocation = async (query: string, language = 'es'): Promise<LocationResult | null> => {
  try {
    console.log('🗺️ Geocoding with OpenStreetMap:', query);
    
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      'accept-language': language,
      addressdetails: '1'
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        'User-Agent': 'SkyRanch Farm Management App'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const results: NominatimResult[] = await response.json();
    
    if (results.length === 0) {
      console.log('🗺️ No results found for:', query);
      return null;
    }

    const result = results[0];
    
    console.log('🗺️ Geocoding result:', result);
    
    return {
      place_id: result.place_id,
      display_name: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      types: [result.class, result.type]
    };
  } catch (error) {
    console.error('🗺️ Geocoding error:', error);
    throw error;
  }
};