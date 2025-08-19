
import { supabase } from '@/integrations/supabase/client';
import type { Animal } from '@/stores/animalStore';

// Fetch full animals with enhanced error handling and timeout
export const getAllAnimals = async (): Promise<Animal[]> => {
  try {
    console.log('🔍 ANIMALS: Fetching all animals...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ ANIMALS: No authenticated user');
      return [];
    }

    console.log('👤 ANIMALS: Authenticated as:', user.email);

    console.log('🔄 ANIMALS: Executing query...');
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('user_id', user.id)
      .neq('lifecycle_status', 'deceased')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ ANIMALS: Query error:', error);
      console.error('❌ ANIMALS: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return [];
    }

    console.log('✅ ANIMALS: Successfully fetched animals:', data?.length || 0);
    
    // Map with validation
    const mappedAnimals = (data || []).map(animal => {
      if (!animal.id || !animal.name) {
        console.warn('⚠️ ANIMALS: Invalid animal data:', animal);
        return null;
      }
      return {
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
      };
    }).filter(Boolean);

    console.log('✅ ANIMALS: Mapped animals count:', mappedAnimals.length);
    return mappedAnimals as Animal[];
  } catch (error) {
    console.error('❌ ANIMALS: Exception in getAllAnimals:', error);
    if (error instanceof Error) {
      console.error('❌ ANIMALS: Error name:', error.name);
      console.error('❌ ANIMALS: Error message:', error.message);
    }
    return [];
  }
};

// Lean fetch for Dashboard stats: only id and species
export const getAnimalsLean = async (): Promise<Array<Pick<Animal, 'id' | 'species'>>> => {
  try {
    console.log('🔍 Starting getAnimalsLean...');
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 getAnimalsLean user check:', user?.email);
    
    if (!user) {
      console.log('❌ No user in getAnimalsLean');
      return [];
    }

    console.log('🔄 Executing animals query...');
    const { data, error } = await supabase
      .from('animals')
      .select('id,species')
      .eq('user_id', user.id)
      .neq('lifecycle_status', 'deceased')
      .order('created_at', { ascending: false });

    console.log('📊 Animals query result:', { data: data?.length, error });

    if (error) {
      console.error('❌ Error in getAnimalsLean:', error);
      return [];
    }

    const result = (data || []).map(a => ({ id: a.id, species: a.species }));
    console.log('✅ getAnimalsLean completed successfully:', result.length);
    return result;
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

    const { data, error } = await supabase
      .from('animals')
      .select('id,name,tag,species,breed,birth_date,gender,weight,color,health_status,image_url,lifecycle_status')
      .eq('user_id', user.id)
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

    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('user_id', user.id)
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
