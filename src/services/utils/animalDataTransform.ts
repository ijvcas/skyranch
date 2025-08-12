
import type { Animal } from '@/stores/animalStore';

// Helper function to transform database row to Animal interface
export const transformAnimalData = (data: any): Animal => {
  console.log('Transforming animal data:', data);
  
  const animal = {
    id: data.id,
    name: data.name || '',
    tag: data.tag || '',
    species: data.species || 'bovino',
    breed: data.breed || '',
    birthDate: data.birth_date || '',
    gender: data.gender || '',
    weight: data.weight ? data.weight.toString() : '',
    color: data.color || '',
    motherId: data.mother_id || '',
    fatherId: data.father_id || '',
    healthStatus: data.health_status || 'healthy',
    notes: data.notes || '',
    image: data.image_url || null,
    lifecycleStatus: data.lifecycle_status || 'active',
    dateOfDeath: data.date_of_death || '',
    causeOfDeath: data.cause_of_death || '',
    maternalGrandmotherId: data.maternal_grandmother_id || '',
    maternalGrandfatherId: data.maternal_grandfather_id || '',
    paternalGrandmotherId: data.paternal_grandmother_id || '',
    paternalGrandfatherId: data.paternal_grandfather_id || '',
    // New great-grandparent fields (3rd generation)
    maternalGreatGrandmotherMaternalId: data.maternal_great_grandmother_maternal_id || '',
    maternalGreatGrandfatherMaternalId: data.maternal_great_grandfather_maternal_id || '',
    maternalGreatGrandmotherPaternalId: data.maternal_great_grandmother_paternal_id || '',
    maternalGreatGrandfatherPaternalId: data.maternal_great_grandfather_paternal_id || '',
    paternalGreatGrandmotherMaternalId: data.paternal_great_grandmother_maternal_id || '',
    paternalGreatGrandfatherMaternalId: data.paternal_great_grandfather_maternal_id || '',
    paternalGreatGrandmotherPaternalId: data.paternal_great_grandmother_paternal_id || '',
    paternalGreatGrandfatherPaternalId: data.paternal_great_grandfather_paternal_id || '',
  };

  console.log('Transformed animal:', animal);
  return animal;
};
