import { supabase } from '@/integrations/supabase/client';
import type { Animal } from '@/stores/animalStore';
import { queryPerformanceMonitor } from '@/utils/queryConfig';

// Optimized fetch - RLS policies handle all access control
export const getAllAnimals = async (includeDeceased = false): Promise<Animal[]> => {
  const queryKey = 'getAllAnimals';
  queryPerformanceMonitor.markQueryStart(queryKey);
  
  try {
    let query = supabase
      .from('animals')
      .select('*');
    
    if (!includeDeceased) {
      query = query.neq('lifecycle_status', 'deceased');
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
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
    queryPerformanceMonitor.markQueryEnd(queryKey);
    throw error;
  } finally {
    queryPerformanceMonitor.markQueryEnd(queryKey);
  }
};

// Ultra-lean fetch for Dashboard stats - optimized with performance monitoring
export const getAnimalsLean = async (includeDeceased = false): Promise<Array<Pick<Animal, 'id' | 'species'>>> => {
  const queryKey = 'getAnimalsLean';
  queryPerformanceMonitor.markQueryStart(queryKey);
  
  try {
    let query = supabase
      .from('animals')
      .select('id,species')
      .eq('lifecycle_status', 'active');
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []).map(a => ({ id: a.id, species: a.species }));
  } catch (e) {
    queryPerformanceMonitor.markQueryEnd(queryKey);
    throw e;
  } finally {
    queryPerformanceMonitor.markQueryEnd(queryKey);
  }
};

// OPTIMIZED: Fetch only animal IDs and names for dropdowns/selections
export const getAnimalNamesMap = async (includeDeceased = false): Promise<Record<string, string>> => {
  const queryKey = `getAnimalNamesMap-${includeDeceased ? 'all' : 'active'}`;
  queryPerformanceMonitor.markQueryStart(queryKey);
  
  try {
    const query = supabase
      .from('animals')
      .select('id, name');
    
    if (!includeDeceased) {
      query.neq('lifecycle_status', 'deceased');
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Create a map of id -> name
    const nameMap: Record<string, string> = {};
    (data || []).forEach(animal => {
      nameMap[animal.id] = animal.name;
    });

    queryPerformanceMonitor.markQueryEnd(queryKey);
    return nameMap;
  } catch (error) {
    queryPerformanceMonitor.markQueryEnd(queryKey);
    throw error;
  }
};

// OPTIMIZED: Fetch minimal animal data (id, name, species, gender) for breeding/forms
export const getAnimalsForForms = async (includeDeceased = false): Promise<Array<{id: string, name: string, species: string, gender: string | null}>> => {
  const queryKey = `getAnimalsForForms-${includeDeceased ? 'all' : 'active'}`;
  queryPerformanceMonitor.markQueryStart(queryKey);
  
  try {
    const query = supabase
      .from('animals')
      .select('id, name, species, gender');
    
    if (!includeDeceased) {
      query.neq('lifecycle_status', 'deceased');
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    queryPerformanceMonitor.markQueryEnd(queryKey);
    return data || [];
  } catch (error) {
    queryPerformanceMonitor.markQueryEnd(queryKey);
    throw error;
  }
};

// OPTIMIZED: Fetch animals by specific IDs (for breeding page)
export const getAnimalsByIds = async (animalIds: string[]): Promise<Record<string, string>> => {
  const queryKey = 'getAnimalsByIds';
  queryPerformanceMonitor.markQueryStart(queryKey);
  
  try {
    if (animalIds.length === 0) {
      return {};
    }

    // Remove duplicates
    const uniqueIds = [...new Set(animalIds)];

    const { data, error } = await supabase
      .from('animals')
      .select('id, name')
      .in('id', uniqueIds);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Create a map of id -> name
    const nameMap: Record<string, string> = {};
    (data || []).forEach(animal => {
      nameMap[animal.id] = animal.name;
    });

    queryPerformanceMonitor.markQueryEnd(queryKey);
    return nameMap;
  } catch (error) {
    queryPerformanceMonitor.markQueryEnd(queryKey);
    throw error;
  }
};

// OPTIMIZED: Fetch all health records with animal names in a single query
export const getAllHealthRecordsWithAnimals = async () => {
  const queryKey = 'getAllHealthRecordsWithAnimals';
  queryPerformanceMonitor.markQueryStart(queryKey);
  
  try {
    const { data, error } = await supabase
      .from('health_records')
      .select(`
        id,
        animal_id,
        record_type,
        title,
        description,
        veterinarian,
        medication,
        dosage,
        cost,
        date_administered,
        next_due_date,
        notes,
        created_at,
        updated_at,
        animals!inner (
          id,
          name,
          lifecycle_status
        )
      `)
      .eq('animals.lifecycle_status', 'active')
      .order('date_administered', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    queryPerformanceMonitor.markQueryEnd(queryKey);
    return (data || []).map(record => ({
      id: record.id,
      animalId: record.animal_id,
      animalName: record.animals.name,
      recordType: record.record_type,
      title: record.title,
      description: record.description,
      veterinarian: record.veterinarian,
      medication: record.medication,
      dosage: record.dosage,
      cost: record.cost,
      dateAdministered: record.date_administered,
      nextDueDate: record.next_due_date,
      notes: record.notes,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));
  } catch (error) {
    queryPerformanceMonitor.markQueryEnd(queryKey);
    throw error;
  }
};

// Ultra-lean fetch for Animals list - only essential display columns for fast loading
export const getAnimalsPageUltraLean = async (limit = 50, offset = 0, includeDeceased = false): Promise<Animal[]> => {
  const startTime = performance.now();
  
  try {
    let query = supabase
      .from('animals')
      .select('id,name,tag,species,health_status,lifecycle_status,gender,breed');
    
    if (!includeDeceased) {
      query = query.neq('lifecycle_status', 'deceased');
    }
    
    const { data, error } = await query
      .order('name', { ascending: true }) // Sort by name for better performance
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error in getAnimalsPageUltraLean:', error);
      throw error;
    }

    const endTime = performance.now();
    console.log(`⚡ Ultra-lean query took ${(endTime - startTime).toFixed(2)}ms`);

    if (!data) return [];

    return data.map((animal: any): Animal => ({
      id: animal.id,
      name: animal.name || 'Sin nombre',
      tag: animal.tag || '',
      species: animal.species || 'bovino',
      breed: animal.breed || '',
      birthDate: '', // Will be loaded progressively
      gender: animal.gender || '',
      weight: '',
      color: '',
      motherId: '',
      fatherId: '',
      maternal_grandmother_id: '',
      maternal_grandfather_id: '',
      paternal_grandmother_id: '',
      paternal_grandfather_id: '',
      maternal_great_grandmother_maternal_id: '',
      maternal_great_grandfather_maternal_id: '',
      maternal_great_grandmother_paternal_id: '',
      maternal_great_grandfather_paternal_id: '',
      paternal_great_grandmother_maternal_id: '',
      paternal_great_grandfather_maternal_id: '',
      paternal_great_grandmother_paternal_id: '',
      paternal_great_grandfather_paternal_id: '',
      healthStatus: animal.health_status || 'healthy',
      notes: '',
      image: null, // Will be loaded progressively
      current_lot_id: undefined,
      lifecycleStatus: animal.lifecycle_status || 'active',
      dateOfDeath: '',
      causeOfDeath: ''
    }));
  } catch (error) {
    const endTime = performance.now();
    console.error(`❌ Ultra-lean query failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
    throw error;
  }
};

// Enhanced lean fetch with additional details for progressive loading
export const getAnimalsPageLean = async (limit = 50, offset = 0, includeDeceased = false): Promise<Animal[]> => {
  try {
    let query = supabase
      .from('animals')
      .select('id,name,tag,species,health_status,lifecycle_status,gender,breed,birth_date,image_url,weight,color');
    
    if (!includeDeceased) {
      query = query.neq('lifecycle_status', 'deceased');
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error in getAnimalsPageLean:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(animal => ({
      id: animal.id,
      name: animal.name || '',
      tag: animal.tag || '',
      species: animal.species || 'bovino',
      breed: animal.breed || '',
      birthDate: animal.birth_date || '',
      gender: animal.gender || '',
      weight: animal.weight ? animal.weight.toString() : '',
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
      dateOfDeath: '',
      causeOfDeath: ''
    }));
  } catch (e) {
    console.error('Error in getAnimalsPageLean:', e);
    throw e;
  }
};

// High-performance paged fetch for Animals list - minimal columns
export const getAnimalsPage = async (limit = 50, offset = 0, includeDeceased = false): Promise<Animal[]> => {
  try {
    let query = supabase
      .from('animals')
      .select('id,name,tag,species,breed,birth_date,gender,weight,color,health_status,image_url,lifecycle_status,date_of_death,cause_of_death');
    
    if (!includeDeceased) {
      query = query.neq('lifecycle_status', 'deceased');
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
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
      dateOfDeath: animal.date_of_death || '',
      causeOfDeath: animal.cause_of_death || ''
    }));
  } catch (e) {
    throw e;
  }
};

export const getAnimal = async (id: string): Promise<Animal | null> => {
  try {
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      return null;
    }
    
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
    throw error;
  }
};
