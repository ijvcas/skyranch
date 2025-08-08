import { supabase } from '@/integrations/supabase/client';

export interface WeatherSettings {
  id: string;
  created_at: string;
  updated_at: string;
  location_query: string;
  display_name: string;
  place_id: string;
  lat: number;
  lng: number;
  language?: string | null;
  unit_system?: string | null;
}

export class WeatherSettingsService {
  async get(): Promise<WeatherSettings | null> {
    const { data, error } = await supabase
      .from('weather_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching weather_settings:', error);
      return null;
    }

    // Ensure numeric types
    if (data) {
      (data as any).lat = typeof (data as any).lat === 'string' ? parseFloat((data as any).lat) : data.lat;
      (data as any).lng = typeof (data as any).lng === 'string' ? parseFloat((data as any).lng) : data.lng;
    }

    return data as WeatherSettings | null;
  }

  async upsert(payload: Partial<WeatherSettings> & Pick<WeatherSettings, 'location_query' | 'display_name' | 'place_id' | 'lat' | 'lng'>): Promise<WeatherSettings | null> {
    // Try to find existing row
    const current = await this.get();
    if (current) {
      const { data, error } = await supabase
        .from('weather_settings')
        .update({
          location_query: payload.location_query,
          display_name: payload.display_name,
          place_id: payload.place_id,
          lat: payload.lat,
          lng: payload.lng,
          language: payload.language ?? current.language,
          unit_system: payload.unit_system ?? current.unit_system,
        })
        .eq('id', current.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating weather_settings:', error);
        return null;
      }

      return data as WeatherSettings;
    } else {
      const { data, error } = await supabase
        .from('weather_settings')
        .insert({
          location_query: payload.location_query,
          display_name: payload.display_name,
          place_id: payload.place_id,
          lat: payload.lat,
          lng: payload.lng,
          language: payload.language ?? 'es',
          unit_system: payload.unit_system ?? 'metric',
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting weather_settings:', error);
        return null;
      }

      return data as WeatherSettings;
    }
  }

  async syncFromFarmProfile(): Promise<WeatherSettings | null> {
    // Get farm profile with location
    const { data: farmProfile, error: farmError } = await supabase
      .from('farm_profiles')
      .select('location_name, location_coordinates')
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (farmError) {
      console.error('Error fetching farm profile for weather sync:', farmError);
      return null;
    }

    if (!farmProfile?.location_coordinates || !farmProfile?.location_name) {
      return null;
    }

    // Parse coordinates
    const [lat, lng] = farmProfile.location_coordinates.split(',').map(Number);
    
    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid coordinates in farm profile:', farmProfile.location_coordinates);
      return null;
    }

    // Update weather settings with farm location
    return this.upsert({
      lat,
      lng,
      location_query: farmProfile.location_name,
      display_name: farmProfile.location_name,
      place_id: '', // We don't store place_id in farm profile
      language: 'es',
      unit_system: 'metric'
    });
  }
}

export const weatherSettingsService = new WeatherSettingsService();
