
import { supabase } from '@/integrations/supabase/client';
import type { Animal } from '@/stores/animalStore';

// Fetch full animals (legacy, used in several areas)
export const getAllAnimals = async (): Promise<Animal[]> => {
  try {
    console.log('🔍 Fetching all animals...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !user.email) {
      console.log('❌ No authenticated user');
      return [];
    }

    // First try to get the user's app_users record
    const { data: appUser, error: userError } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (userError || !appUser) {
      console.log('❌ User not found in app_users, trying direct query');
      // Try direct query as fallback
      const { data, error } = await supabase
        .from('animals')
        .select('*')
        .neq('lifecycle_status', 'deceased')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching animals:', error);
        return [];
      }

      // No need to filter - RLS policies handle access control
      const filteredData = data || [];
      console.log('✅ Successfully fetched animals (fallback):', filteredData.length);
      
      return filteredData.map(animal => ({
        id: animal.id,
        name: animal.name,
        tag: animal.tag,
        species: animal.species,
        breed: animal.breed || '',
        birthDate: animal.birth_date || '',
        gender: animal.gender || '',
        weight: animal.weight?.toString() || '',
        color: animal.color || '',
        motherId: animal.mother_id || '',
        fatherId: animal.father_id || '',
        maternalGrandmotherId: animal.maternal_grandmother_id || '',
        maternalGrandfatherId: animal.maternal_grandfather_id || '',
        paternalGrandmotherId: animal.paternal_grandmother_id || '',
        paternalGrandfatherId: animal.paternal_grandfather_id || '',
        maternalGreatGrandmotherMaternalId: animal.maternal_great_grandmother_maternal_id || '',
        maternalGreatGrandfatherMaternalId: animal.maternal_great_grandfather_maternal_id || '',
        maternalGreatGrandmotherPaternalId: animal.maternal_great_grandmother_paternal_id || '',
        maternalGreatGrandfatherPaternalId: animal.maternal_great_grandfather_paternal_id || '',
        paternalGreatGrandmotherMaternalId: animal.paternal_great_grandmother_maternal_id || '',
        paternalGreatGrandfatherMaternalId: animal.paternal_great_grandfather_maternal_id || '',
        paternalGreatGrandmotherPaternalId: animal.paternal_great_grandmother_paternal_id || '',
        paternalGreatGrandfatherPaternalId: animal.paternal_great_grandfather_paternal_id || '',
        healthStatus: animal.health_status || 'healthy',
        notes: animal.notes || '',
        image: animal.image_url,
        current_lot_id: animal.current_lot_id,
        lifecycleStatus: animal.lifecycle_status || 'active',
        dateOfDeath: animal.date_of_death || '',
        causeOfDeath: animal.cause_of_death || ''
      }));
    }

    // Get all animals (shared data) - RLS policies handle access control
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .neq('lifecycle_status', 'deceased')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching animals:', error);
      return [];
    }

    console.log('✅ Successfully fetched animals:', data?.length || 0);
    
    return (data || []).map(animal => ({
      id: animal.id,
      name: animal.name,
      tag: animal.tag,
      species: animal.species,
      breed: animal.breed || '',
      birthDate: animal.birth_date || '',
      gender: animal.gender || '',
      weight: animal.weight?.toString() || '',
      color: animal.color || '',
      motherId: animal.mother_id || '',
      fatherId: animal.father_id || '',
      maternalGrandmotherId: animal.maternal_grandmother_id || '',
      maternalGrandfatherId: animal.maternal_grandfather_id || '',
      paternalGrandmotherId: animal.paternal_grandmother_id || '',
      paternalGrandfatherId: animal.paternal_grandfather_id || '',
      maternalGreatGrandmotherMaternalId: animal.maternal_great_grandmother_maternal_id || '',
      maternalGreatGrandfatherMaternalId: animal.maternal_great_grandfather_maternal_id || '',
      maternalGreatGrandmotherPaternalId: animal.maternal_great_grandmother_paternal_id || '',
      maternalGreatGrandfatherPaternalId: animal.maternal_great_grandfather_paternal_id || '',
      paternalGreatGrandmotherMaternalId: animal.paternal_great_grandmother_maternal_id || '',
      paternalGreatGrandfatherMaternalId: animal.paternal_great_grandfather_maternal_id || '',
      paternalGreatGrandmotherPaternalId: animal.paternal_great_grandmother_paternal_id || '',
      paternalGreatGrandfatherPaternalId: animal.paternal_great_grandfather_paternal_id || '',
      healthStatus: animal.health_status || 'healthy',
      notes: animal.notes || '',
      image: animal.image_url,
      current_lot_id: animal.current_lot_id,
      lifecycleStatus: animal.lifecycle_status || 'active',
      dateOfDeath: animal.date_of_death || '',
      causeOfDeath: animal.cause_of_death || ''
    }));
  } catch (error) {
    console.error('❌ Unexpected error in getAllAnimals:', error);
    return [];
  }
};

// Lean fetch for Dashboard stats: only id and species
export const getAnimalsLean = async (): Promise<Array<Pick<Animal, 'id' | 'species'>>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      console.log('❌ No authenticated user for getAnimalsLean');
      return [];
    }

    // First try to get the user's app_users record to get their user_id
    const { data: appUser, error: userError } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (userError || !appUser) {
      console.log('❌ User not found in app_users, trying direct query');
      // Try direct query without user_id filter as fallback
      const { data, error } = await supabase
        .from('animals')
        .select('id,species,user_id')
        .neq('lifecycle_status', 'deceased')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error in getAnimalsLean fallback:', error);
        return [];
      }

      // No need to filter - RLS policies handle access control
      const filteredData = data || [];
      return filteredData.map(a => ({ id: a.id, species: a.species }));
    }

    // Get all animals (shared data) - RLS policies handle access control
    const { data, error } = await supabase
      .from('animals')
      .select('id,species')
      .neq('lifecycle_status', 'deceased')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error in getAnimalsLean:', error);
      return [];
    }

    return (data || []).map(a => ({ id: a.id, species: a.species }));
  } catch (e) {
    console.error('❌ Unexpected error in getAnimalsLean:', e);
    return [];
  }
};

// Paged fetch for Animals list with minimal columns needed for the cards
export const getAnimalsPage = async (limit = 50, offset = 0): Promise<Animal[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await (supabase
      .from('animals') as any)
      .select('id,name,tag,species,breed,birth_date,gender,weight,color,health_status,image_url,lifecycle_status')
      .neq('lifecycle_status', 'deceased')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Error in getAnimalsPage:', error);
      return [];
    }

    return (data || []).map(animal => ({
      id: animal.id,
      name: animal.name || '',
      tag: animal.tag || '',
      species: animal.species || 'bovino',
      breed: animal.breed || '',
      birthDate: animal.birth_date || '',
      gender: animal.gender || '',
      weight: animal.weight?.toString() || '',
      color: animal.color || '',
      motherId: '',
      fatherId: '',
      maternalGrandmotherId: '',
      maternalGrandfatherId: '',
      paternalGrandmotherId: '',
      paternalGrandfatherId: '',
      maternalGreatGrandmotherMaternalId: '',
      maternalGreatGrandfatherMaternalId: '',
      maternalGreatGrandmotherPaternalId: '',
      maternalGreatGrandfatherPaternalId: '',
      paternalGreatGrandmotherMaternalId: '',
      paternalGreatGrandfatherMaternalId: '',
      paternalGreatGrandmotherPaternalId: '',
      paternalGreatGrandfatherPaternalId: '',
      healthStatus: animal.health_status || 'healthy',
      notes: '',
      image: animal.image_url || null,
      current_lot_id: undefined,
      lifecycleStatus: animal.lifecycle_status || 'active',
    }));
  } catch (e) {
    console.error('❌ Unexpected error in getAnimalsPage:', e);
    return [];
  }
};

export const getAnimal = async (id: string): Promise<Animal | null> => {
  try {
    console.log('🔍 Fetching animal with ID:', id);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ No authenticated user for getAnimal');
      return null;
    }

    // Remove user_id filter - all authenticated users can see all animals
    const { data, error } = await (supabase
      .from('animals') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching animal:', error);
      return null;
    }

    if (!data) {
      console.log('❌ No animal found with ID:', id);
      return null;
    }

    console.log('✅ Successfully fetched animal:', data.name);
    
    return {
      id: data.id,
      name: data.name,
      tag: data.tag,
      species: data.species,
      breed: data.breed || '',
      birthDate: data.birth_date || '',
      gender: data.gender || '',
      weight: data.weight?.toString() || '',
      color: data.color || '',
      motherId: data.mother_id || '',
      fatherId: data.father_id || '',
      maternalGrandmotherId: data.maternal_grandmother_id || '',
      maternalGrandfatherId: data.maternal_grandfather_id || '',
      paternalGrandmotherId: data.paternal_grandmother_id || '',
      paternalGrandfatherId: data.paternal_grandfather_id || '',
      maternalGreatGrandmotherMaternalId: data.maternal_great_grandmother_maternal_id || '',
      maternalGreatGrandfatherMaternalId: data.maternal_great_grandfather_maternal_id || '',
      maternalGreatGrandmotherPaternalId: data.maternal_great_grandmother_paternal_id || '',
      maternalGreatGrandfatherPaternalId: data.maternal_great_grandfather_paternal_id || '',
      paternalGreatGrandmotherMaternalId: data.paternal_great_grandmother_maternal_id || '',
      paternalGreatGrandfatherMaternalId: data.paternal_great_grandfather_maternal_id || '',
      paternalGreatGrandmotherPaternalId: data.paternal_great_grandmother_paternal_id || '',
      paternalGreatGrandfatherPaternalId: data.paternal_great_grandfather_paternal_id || '',
      healthStatus: data.health_status || 'healthy',
      notes: data.notes || '',
      image: data.image_url,
      current_lot_id: data.current_lot_id,
      lifecycleStatus: data.lifecycle_status || 'active',
      dateOfDeath: data.date_of_death || '',
      causeOfDeath: data.cause_of_death || ''
    };
  } catch (error) {
    console.error('❌ Unexpected error in getAnimal:', error);
    return null;
  }
};
