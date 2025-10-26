
import type { Animal } from '@/stores/animalStore';

// Helper function to map Animal interface to database format
export const mapAnimalToDatabase = (animal: Omit<Animal, 'id'>, userId: string) => {
  return {
    name: animal.name,
    tag: animal.tag,
    species: animal.species,
    breed: animal.breed,
    birth_date: animal.birthDate || null,
    gender: animal.gender,
    weight: animal.weight ? parseFloat(animal.weight) : null,
    color: animal.color,
    health_status: animal.healthStatus,
    notes: animal.notes,
    image_url: animal.image,
    lifecycle_status: animal.lifecycleStatus || 'active',
    date_of_death: animal.dateOfDeath || null,
    cause_of_death: animal.causeOfDeath || null,
    pedigree_max_generation: animal.pedigree_max_generation || 5,
    user_id: userId,
  };
};

// Helper function to create update object for database
export const createUpdateObject = (animal: Omit<Animal, 'id'>) => {
  return {
    name: animal.name,
    tag: animal.tag,
    species: animal.species,
    breed: animal.breed,
    birth_date: animal.birthDate || null,
    gender: animal.gender,
    weight: animal.weight ? parseFloat(animal.weight) : null,
    color: animal.color,
    health_status: animal.healthStatus,
    notes: animal.notes,
    image_url: animal.image,
    lifecycle_status: animal.lifecycleStatus || 'active',
    date_of_death: animal.dateOfDeath || null,
    cause_of_death: animal.causeOfDeath || null,
    pedigree_max_generation: animal.pedigree_max_generation || 5,
  };
};

// Helper function to map database format to Animal interface
export const fromDatabase = (dbAnimal: any): Animal => {
  return {
    id: dbAnimal.id,
    name: dbAnimal.name,
    tag: dbAnimal.tag,
    species: dbAnimal.species,
    breed: dbAnimal.breed || '',
    birthDate: dbAnimal.birth_date,
    gender: dbAnimal.gender,
    weight: dbAnimal.weight ? dbAnimal.weight.toString() : '',
    color: dbAnimal.color || '',
    healthStatus: dbAnimal.health_status,
    notes: dbAnimal.notes || '',
    image: dbAnimal.image_url || '',
    lifecycleStatus: dbAnimal.lifecycle_status || 'active',
    dateOfDeath: dbAnimal.date_of_death || '',
    causeOfDeath: dbAnimal.cause_of_death || '',
    pedigree_max_generation: dbAnimal.pedigree_max_generation || 5,
    fatherId: dbAnimal.father_id || '',
    motherId: dbAnimal.mother_id || '',
    paternal_grandfather_id: dbAnimal.paternal_grandfather_id || '',
    paternal_grandmother_id: dbAnimal.paternal_grandmother_id || '',
    maternal_grandfather_id: dbAnimal.maternal_grandfather_id || '',
    maternal_grandmother_id: dbAnimal.maternal_grandmother_id || '',
    paternal_great_grandfather_paternal_id: dbAnimal.paternal_great_grandfather_paternal_id || '',
    paternal_great_grandmother_paternal_id: dbAnimal.paternal_great_grandmother_paternal_id || '',
    paternal_great_grandfather_maternal_id: dbAnimal.paternal_great_grandfather_maternal_id || '',
    paternal_great_grandmother_maternal_id: dbAnimal.paternal_great_grandmother_maternal_id || '',
    maternal_great_grandfather_paternal_id: dbAnimal.maternal_great_grandfather_paternal_id || '',
    maternal_great_grandmother_paternal_id: dbAnimal.maternal_great_grandmother_paternal_id || '',
    maternal_great_grandmother_maternal_id: dbAnimal.maternal_great_grandmother_maternal_id || '',
    // Generation 4
    gen4_paternal_ggggf_p: dbAnimal.gen4_paternal_ggggf_p || '',
    gen4_paternal_ggggm_p: dbAnimal.gen4_paternal_ggggm_p || '',
    gen4_paternal_gggmf_p: dbAnimal.gen4_paternal_gggmf_p || '',
    gen4_paternal_gggmm_p: dbAnimal.gen4_paternal_gggmm_p || '',
    gen4_paternal_ggfgf_p: dbAnimal.gen4_paternal_ggfgf_p || '',
    gen4_paternal_ggfgm_p: dbAnimal.gen4_paternal_ggfgm_p || '',
    gen4_paternal_ggmgf_p: dbAnimal.gen4_paternal_ggmgf_p || '',
    gen4_paternal_ggmgm_p: dbAnimal.gen4_paternal_ggmgm_p || '',
    gen4_maternal_ggggf_m: dbAnimal.gen4_maternal_ggggf_m || '',
    gen4_maternal_ggggm_m: dbAnimal.gen4_maternal_ggggm_m || '',
    gen4_maternal_gggmf_m: dbAnimal.gen4_maternal_gggmf_m || '',
    gen4_maternal_gggmm_m: dbAnimal.gen4_maternal_gggmm_m || '',
    gen4_maternal_ggfgf_m: dbAnimal.gen4_maternal_ggfgf_m || '',
    gen4_maternal_ggfgm_m: dbAnimal.gen4_maternal_ggfgm_m || '',
    gen4_maternal_ggmgf_m: dbAnimal.gen4_maternal_ggmgf_m || '',
    gen4_maternal_ggmgm_m: dbAnimal.gen4_maternal_ggmgm_m || '',
    // Generation 5
    gen5_paternal_1: dbAnimal.gen5_paternal_1 || '',
    gen5_paternal_2: dbAnimal.gen5_paternal_2 || '',
    gen5_paternal_3: dbAnimal.gen5_paternal_3 || '',
    gen5_paternal_4: dbAnimal.gen5_paternal_4 || '',
    gen5_paternal_5: dbAnimal.gen5_paternal_5 || '',
    gen5_paternal_6: dbAnimal.gen5_paternal_6 || '',
    gen5_paternal_7: dbAnimal.gen5_paternal_7 || '',
    gen5_paternal_8: dbAnimal.gen5_paternal_8 || '',
    gen5_paternal_9: dbAnimal.gen5_paternal_9 || '',
    gen5_paternal_10: dbAnimal.gen5_paternal_10 || '',
    gen5_paternal_11: dbAnimal.gen5_paternal_11 || '',
    gen5_paternal_12: dbAnimal.gen5_paternal_12 || '',
    gen5_paternal_13: dbAnimal.gen5_paternal_13 || '',
    gen5_paternal_14: dbAnimal.gen5_paternal_14 || '',
    gen5_paternal_15: dbAnimal.gen5_paternal_15 || '',
    gen5_paternal_16: dbAnimal.gen5_paternal_16 || '',
    gen5_maternal_1: dbAnimal.gen5_maternal_1 || '',
    gen5_maternal_2: dbAnimal.gen5_maternal_2 || '',
    gen5_maternal_3: dbAnimal.gen5_maternal_3 || '',
    gen5_maternal_4: dbAnimal.gen5_maternal_4 || '',
    gen5_maternal_5: dbAnimal.gen5_maternal_5 || '',
    gen5_maternal_6: dbAnimal.gen5_maternal_6 || '',
    gen5_maternal_7: dbAnimal.gen5_maternal_7 || '',
    gen5_maternal_8: dbAnimal.gen5_maternal_8 || '',
    gen5_maternal_9: dbAnimal.gen5_maternal_9 || '',
    gen5_maternal_10: dbAnimal.gen5_maternal_10 || '',
    gen5_maternal_11: dbAnimal.gen5_maternal_11 || '',
    gen5_maternal_12: dbAnimal.gen5_maternal_12 || '',
    gen5_maternal_13: dbAnimal.gen5_maternal_13 || '',
    gen5_maternal_14: dbAnimal.gen5_maternal_14 || '',
    gen5_maternal_15: dbAnimal.gen5_maternal_15 || '',
    gen5_maternal_16: dbAnimal.gen5_maternal_16 || ''
  };
};

// Export as default object for backward compatibility
export const animalDatabaseMapper = {
  mapAnimalToDatabase,
  createUpdateObject,
  fromDatabase
};
