
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
    fatherId: dbAnimal.father_id || '',
    motherId: dbAnimal.mother_id || '',
    paternalGrandfatherId: dbAnimal.paternal_grandfather_id || '',
    paternalGrandmotherId: dbAnimal.paternal_grandmother_id || '',
    maternalGrandfatherId: dbAnimal.maternal_grandfather_id || '',
    maternalGrandmotherId: dbAnimal.maternal_grandmother_id || '',
    paternalGreatGrandfatherPaternalId: dbAnimal.paternal_great_grandfather_paternal_id || '',
    paternalGreatGrandmotherPaternalId: dbAnimal.paternal_great_grandmother_paternal_id || '',
    paternalGreatGrandfatherMaternalId: dbAnimal.paternal_great_grandfather_maternal_id || '',
    paternalGreatGrandmotherMaternalId: dbAnimal.paternal_great_grandmother_maternal_id || '',
    maternalGreatGrandfatherPaternalId: dbAnimal.maternal_great_grandfather_paternal_id || '',
    maternalGreatGrandmotherPaternalId: dbAnimal.maternal_great_grandmother_paternal_id || '',
    maternalGreatGrandfatherMaternalId: dbAnimal.maternal_great_grandfather_maternal_id || '',
    maternalGreatGrandmotherMaternalId: dbAnimal.maternal_great_grandmother_maternal_id || ''
  };
};

// Export as default object for backward compatibility
export const animalDatabaseMapper = {
  mapAnimalToDatabase,
  createUpdateObject,
  fromDatabase
};
