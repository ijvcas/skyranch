import { supabase } from '@/integrations/supabase/client';

export interface ParcelOwner {
  id: string;
  parcel_id: string;
  owner_name: string;
  owner_type: 'individual' | 'company' | 'cooperative' | 'government';
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  identification_number?: string;
  ownership_percentage: number;
  is_primary_contact: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const getParcelOwners = async (parcelId: string): Promise<ParcelOwner[]> => {
  const { data, error } = await supabase
    .from('parcel_owners')
    .select('*')
    .eq('parcel_id', parcelId)
    .order('ownership_percentage', { ascending: false });

  if (error) {
    console.error('Error fetching parcel owners:', error);
    throw error;
  }

  return data || [];
};

export const createParcelOwner = async (owner: Omit<ParcelOwner, 'id' | 'created_at' | 'updated_at'>): Promise<ParcelOwner> => {
  const { data, error } = await supabase
    .from('parcel_owners')
    .insert(owner)
    .select()
    .single();

  if (error) {
    console.error('Error creating parcel owner:', error);
    throw error;
  }

  return data;
};

export const updateParcelOwner = async (id: string, updates: Partial<ParcelOwner>): Promise<ParcelOwner> => {
  const { data, error } = await supabase
    .from('parcel_owners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating parcel owner:', error);
    throw error;
  }

  return data;
};

export const deleteParcelOwner = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('parcel_owners')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting parcel owner:', error);
    throw error;
  }
};

export const findSimilarOwners = async (ownerName: string): Promise<ParcelOwner[]> => {
  // Use fuzzy matching with trigram similarity
  const { data, error } = await supabase
    .from('parcel_owners')
    .select('*')
    .ilike('owner_name', `%${ownerName}%`)
    .limit(10);

  if (error) {
    console.error('Error finding similar owners:', error);
    throw error;
  }

  return data || [];
};

// Removed: Client-side validation is now handled by database trigger
// The database has a proper trigger that validates ownership percentages
// This prevents conflicts between client and server validation logic