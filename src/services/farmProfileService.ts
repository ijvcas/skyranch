import { supabase } from '@/integrations/supabase/client';

export interface FarmProfile {
  id: string;
  farm_name: string;
  logo_url?: string;
  picture_url?: string;
  location_name?: string;
  location_coordinates?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface FarmProfileFormData {
  farm_name: string;
  location_name?: string;
  location_coordinates?: string;
}

class FarmProfileService {
  async getFarmProfile(): Promise<FarmProfile | null> {
    const { data, error } = await supabase
      .from('farm_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching farm profile:', error);
      throw error;
    }

    return data;
  }

  async createFarmProfile(profileData: FarmProfileFormData): Promise<FarmProfile> {
    const { data, error } = await supabase
      .from('farm_profiles')
      .insert({
        ...profileData,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating farm profile:', error);
      throw error;
    }

    return data;
  }

  async updateFarmProfile(id: string, profileData: Partial<FarmProfileFormData>): Promise<FarmProfile> {
    console.log('🔄 [FARM SERVICE] Updating farm profile:', id, 'with data:', profileData);
    
    const { data, error } = await supabase
      .from('farm_profiles')
      .update(profileData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [FARM SERVICE] Error updating farm profile:', error);
      throw error;
    }

    console.log('✅ [FARM SERVICE] Farm profile updated successfully:', data);
    return data;
  }

  async uploadLogo(file: File): Promise<string> {
    const fileName = `logo-${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('farm-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('farm-logos')
      .getPublicUrl(data.path);

    return publicUrl;
  }

  async uploadPicture(file: File): Promise<string> {
    const fileName = `picture-${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('farm-pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading picture:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('farm-pictures')
      .getPublicUrl(data.path);

    return publicUrl;
  }

  async updateLogo(id: string, logoUrl: string): Promise<void> {
    const { error } = await supabase
      .from('farm_profiles')
      .update({ logo_url: logoUrl })
      .eq('id', id);

    if (error) {
      console.error('Error updating logo URL:', error);
      throw error;
    }
  }

  async updatePicture(id: string, pictureUrl: string): Promise<void> {
    const { error } = await supabase
      .from('farm_profiles')
      .update({ picture_url: pictureUrl })
      .eq('id', id);

    if (error) {
      console.error('Error updating picture URL:', error);
      throw error;
    }
  }
}

export const farmProfileService = new FarmProfileService();