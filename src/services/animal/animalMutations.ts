import { supabase } from '@/integrations/supabase/client';
import type { Animal } from '@/stores/animalStore';
import { mapAnimalToDatabase, createUpdateObject } from '../utils/animalDatabaseMapper';
import { processParentId } from '../utils/animalParentProcessor';

export const addAnimal = async (animal: Omit<Animal, 'id'>): Promise<boolean> => {
  console.log('🔄 Adding animal with parent data:', {
    motherId: animal.motherId,
    fatherId: animal.fatherId,
    maternalGrandmotherId: animal.maternalGrandmotherId,
    maternalGrandfatherId: animal.maternalGrandfatherId,
    paternalGrandmotherId: animal.paternalGrandmotherId,
    paternalGrandfatherId: animal.paternalGrandfatherId,
    maternalGreatGrandmotherMaternalId: animal.maternalGreatGrandmotherMaternalId,
    maternalGreatGrandfatherMaternalId: animal.maternalGreatGrandfatherMaternalId,
    maternalGreatGrandmotherPaternalId: animal.maternalGreatGrandmotherPaternalId,
    maternalGreatGrandfatherPaternalId: animal.maternalGreatGrandfatherPaternalId,
    paternalGreatGrandmotherMaternalId: animal.paternalGreatGrandmotherMaternalId,
    paternalGreatGrandfatherMaternalId: animal.paternalGreatGrandfatherMaternalId,
    paternalGreatGrandmotherPaternalId: animal.paternalGreatGrandmotherPaternalId,
    paternalGreatGrandfatherPaternalId: animal.paternalGreatGrandfatherPaternalId
  });

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user');
    return false;
  }

  // Process all parent and ancestor IDs concurrently for better performance
  const [
    motherId, 
    fatherId, 
    maternalGrandmotherId, 
    maternalGrandfatherId, 
    paternalGrandmotherId, 
    paternalGrandfatherId,
    maternalGreatGrandmotherMaternalId,
    maternalGreatGrandfatherMaternalId,
    maternalGreatGrandmotherPaternalId,
    maternalGreatGrandfatherPaternalId,
    paternalGreatGrandmotherMaternalId,
    paternalGreatGrandfatherMaternalId,
    paternalGreatGrandmotherPaternalId,
    paternalGreatGrandfatherPaternalId
  ] = await Promise.all([
    processParentId(animal.motherId),
    processParentId(animal.fatherId),
    processParentId(animal.maternalGrandmotherId),
    processParentId(animal.maternalGrandfatherId),
    processParentId(animal.paternalGrandmotherId),
    processParentId(animal.paternalGrandfatherId),
    processParentId(animal.maternalGreatGrandmotherMaternalId),
    processParentId(animal.maternalGreatGrandfatherMaternalId),
    processParentId(animal.maternalGreatGrandmotherPaternalId),
    processParentId(animal.maternalGreatGrandfatherPaternalId),
    processParentId(animal.paternalGreatGrandmotherMaternalId),
    processParentId(animal.paternalGreatGrandfatherMaternalId),
    processParentId(animal.paternalGreatGrandmotherPaternalId),
    processParentId(animal.paternalGreatGrandfatherPaternalId)
  ]);

  console.log('🔄 Processed all ancestor IDs:', {
    motherId,
    fatherId,
    maternalGrandmotherId,
    maternalGrandfatherId,
    paternalGrandmotherId,
    paternalGrandfatherId,
    maternalGreatGrandmotherMaternalId,
    maternalGreatGrandfatherMaternalId,
    maternalGreatGrandmotherPaternalId,
    maternalGreatGrandfatherPaternalId,
    paternalGreatGrandmotherMaternalId,
    paternalGreatGrandfatherMaternalId,
    paternalGreatGrandmotherPaternalId,
    paternalGreatGrandfatherPaternalId
  });

  const databaseData = {
    ...mapAnimalToDatabase(animal, user.id),
    mother_id: motherId,
    father_id: fatherId,
    maternal_grandmother_id: maternalGrandmotherId,
    maternal_grandfather_id: maternalGrandfatherId,
    paternal_grandmother_id: paternalGrandmotherId,
    paternal_grandfather_id: paternalGrandfatherId,
    maternal_great_grandmother_maternal_id: maternalGreatGrandmotherMaternalId,
    maternal_great_grandfather_maternal_id: maternalGreatGrandfatherMaternalId,
    maternal_great_grandmother_paternal_id: maternalGreatGrandmotherPaternalId,
    maternal_great_grandfather_paternal_id: maternalGreatGrandfatherPaternalId,
    paternal_great_grandmother_maternal_id: paternalGreatGrandmotherMaternalId,
    paternal_great_grandfather_maternal_id: paternalGreatGrandfatherMaternalId,
    paternal_great_grandmother_paternal_id: paternalGreatGrandmotherPaternalId,
    paternal_great_grandfather_paternal_id: paternalGreatGrandfatherPaternalId,
  };

  console.log('🔄 Final database data:', databaseData);

  const { error } = await supabase
    .from('animals')
    .insert(databaseData);

  if (error) {
    console.error('Error adding animal:', error);
    return false;
  }

  console.log('✅ Animal added successfully');
  return true;
};

export const updateAnimal = async (id: string, animal: Omit<Animal, 'id'>): Promise<boolean> => {
  console.log('🔄 Updating animal with parent data:', {
    motherId: animal.motherId,
    fatherId: animal.fatherId,
    maternalGrandmotherId: animal.maternalGrandmotherId,
    maternalGrandfatherId: animal.maternalGrandfatherId,
    paternalGrandmotherId: animal.paternalGrandmotherId,
    paternalGrandfatherId: animal.paternalGrandfatherId,
    maternalGreatGrandmotherMaternalId: animal.maternalGreatGrandmotherMaternalId,
    maternalGreatGrandfatherMaternalId: animal.maternalGreatGrandfatherMaternalId,
    maternalGreatGrandmotherPaternalId: animal.maternalGreatGrandmotherPaternalId,
    maternalGreatGrandfatherPaternalId: animal.maternalGreatGrandfatherPaternalId,
    paternalGreatGrandmotherMaternalId: animal.paternalGreatGrandmotherMaternalId,
    paternalGreatGrandfatherMaternalId: animal.paternalGreatGrandfatherMaternalId,
    paternalGreatGrandmotherPaternalId: animal.paternalGreatGrandmotherPaternalId,
    paternalGreatGrandfatherPaternalId: animal.paternalGreatGrandfatherPaternalId
  });

  // Process all parent and ancestor IDs concurrently for better performance
  const [
    motherId, 
    fatherId, 
    maternalGrandmotherId, 
    maternalGrandfatherId, 
    paternalGrandmotherId, 
    paternalGrandfatherId,
    maternalGreatGrandmotherMaternalId,
    maternalGreatGrandfatherMaternalId,
    maternalGreatGrandmotherPaternalId,
    maternalGreatGrandfatherPaternalId,
    paternalGreatGrandmotherMaternalId,
    paternalGreatGrandfatherMaternalId,
    paternalGreatGrandmotherPaternalId,
    paternalGreatGrandfatherPaternalId
  ] = await Promise.all([
    processParentId(animal.motherId),
    processParentId(animal.fatherId),
    processParentId(animal.maternalGrandmotherId),
    processParentId(animal.maternalGrandfatherId),
    processParentId(animal.paternalGrandmotherId),
    processParentId(animal.paternalGrandfatherId),
    processParentId(animal.maternalGreatGrandmotherMaternalId),
    processParentId(animal.maternalGreatGrandfatherMaternalId),
    processParentId(animal.maternalGreatGrandmotherPaternalId),
    processParentId(animal.maternalGreatGrandfatherPaternalId),
    processParentId(animal.paternalGreatGrandmotherMaternalId),
    processParentId(animal.paternalGreatGrandfatherMaternalId),
    processParentId(animal.paternalGreatGrandmotherPaternalId),
    processParentId(animal.paternalGreatGrandfatherPaternalId)
  ]);

  console.log('🔄 Processed all ancestor IDs for update:', {
    motherId,
    fatherId,
    maternalGrandmotherId,
    maternalGrandfatherId,
    paternalGrandmotherId,
    paternalGrandfatherId,
    maternalGreatGrandmotherMaternalId,
    maternalGreatGrandfatherMaternalId,
    maternalGreatGrandmotherPaternalId,
    maternalGreatGrandfatherPaternalId,
    paternalGreatGrandmotherMaternalId,
    paternalGreatGrandfatherMaternalId,
    paternalGreatGrandmotherPaternalId,
    paternalGreatGrandfatherPaternalId
  });

  const updateData = {
    ...createUpdateObject(animal),
    mother_id: motherId,
    father_id: fatherId,
    maternal_grandmother_id: maternalGrandmotherId,
    maternal_grandfather_id: maternalGrandfatherId,
    paternal_grandmother_id: paternalGrandmotherId,
    paternal_grandfather_id: paternalGrandfatherId,
    maternal_great_grandmother_maternal_id: maternalGreatGrandmotherMaternalId,
    maternal_great_grandfather_maternal_id: maternalGreatGrandfatherMaternalId,
    maternal_great_grandmother_paternal_id: maternalGreatGrandmotherPaternalId,
    maternal_great_grandfather_paternal_id: maternalGreatGrandfatherPaternalId,
    paternal_great_grandmother_maternal_id: paternalGreatGrandmotherMaternalId,
    paternal_great_grandfather_maternal_id: paternalGreatGrandfatherMaternalId,
    paternal_great_grandmother_paternal_id: paternalGreatGrandmotherPaternalId,
    paternal_great_grandfather_paternal_id: paternalGreatGrandfatherPaternalId,
  } as any;

  // If animal marked as deceased, clear lot assignment
  if (animal.lifecycleStatus && animal.lifecycleStatus.toLowerCase() === 'deceased') {
    updateData.current_lot_id = null;
  }

  const { error } = await supabase
    .from('animals')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating animal:', error);
    return false;
  }

  console.log('✅ Animal updated successfully');
  return true;
};

export const deleteAnimal = async (id: string): Promise<boolean> => {
  console.log('🔄 Deleting animal with ID:', id);
  
  const { error } = await supabase
    .from('animals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error deleting animal:', error);
    return false;
  }

  console.log('✅ Animal deleted successfully');
  return true;
};
