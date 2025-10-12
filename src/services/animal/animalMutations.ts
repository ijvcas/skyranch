import { supabase } from '@/integrations/supabase/client';
import type { Animal } from '@/stores/animalStore';
import { mapAnimalToDatabase, createUpdateObject } from '../utils/animalDatabaseMapper';
import { processParentId } from '../utils/animalParentProcessor';

export const addAnimal = async (animal: Omit<Animal, 'id'>): Promise<boolean> => {
  console.log('🔄 Adding animal with parent data:', {
    motherId: animal.motherId,
    fatherId: animal.fatherId,
    maternal_grandmother_id: animal.maternal_grandmother_id,
    maternal_grandfather_id: animal.maternal_grandfather_id,
    paternal_grandmother_id: animal.paternal_grandmother_id,
    paternal_grandfather_id: animal.paternal_grandfather_id,
    maternal_great_grandmother_maternal_id: animal.maternal_great_grandmother_maternal_id,
    maternal_great_grandfather_maternal_id: animal.maternal_great_grandfather_maternal_id,
    maternal_great_grandmother_paternal_id: animal.maternal_great_grandmother_paternal_id,
    maternal_great_grandfather_paternal_id: animal.maternal_great_grandfather_paternal_id,
    paternal_great_grandmother_maternal_id: animal.paternal_great_grandmother_maternal_id,
    paternal_great_grandfather_maternal_id: animal.paternal_great_grandfather_maternal_id,
    paternal_great_grandmother_paternal_id: animal.paternal_great_grandmother_paternal_id,
    paternal_great_grandfather_paternal_id: animal.paternal_great_grandfather_paternal_id
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
    processParentId(animal.maternal_grandmother_id),
    processParentId(animal.maternal_grandfather_id),
    processParentId(animal.paternal_grandmother_id),
    processParentId(animal.paternal_grandfather_id),
    processParentId(animal.maternal_great_grandmother_maternal_id),
    processParentId(animal.maternal_great_grandfather_maternal_id),
    processParentId(animal.maternal_great_grandmother_paternal_id),
    processParentId(animal.maternal_great_grandfather_paternal_id),
    processParentId(animal.paternal_great_grandmother_maternal_id),
    processParentId(animal.paternal_great_grandfather_maternal_id),
    processParentId(animal.paternal_great_grandmother_paternal_id),
    processParentId(animal.paternal_great_grandfather_paternal_id)
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
    maternal_grandmother_id: animal.maternal_grandmother_id,
    maternal_grandfather_id: animal.maternal_grandfather_id,
    paternal_grandmother_id: animal.paternal_grandmother_id,
    paternal_grandfather_id: animal.paternal_grandfather_id,
    maternal_great_grandmother_maternal_id: animal.maternal_great_grandmother_maternal_id,
    maternal_great_grandfather_maternal_id: animal.maternal_great_grandfather_maternal_id,
    maternal_great_grandmother_paternal_id: animal.maternal_great_grandmother_paternal_id,
    maternal_great_grandfather_paternal_id: animal.maternal_great_grandfather_paternal_id,
    paternal_great_grandmother_maternal_id: animal.paternal_great_grandmother_maternal_id,
    paternal_great_grandfather_maternal_id: animal.paternal_great_grandfather_maternal_id,
    paternal_great_grandmother_paternal_id: animal.paternal_great_grandmother_paternal_id,
    paternal_great_grandfather_paternal_id: animal.paternal_great_grandfather_paternal_id
  });

  // Process all parent and ancestor IDs concurrently for better performance
  const processedAncestors = await Promise.all([
    processParentId(animal.motherId),
    processParentId(animal.fatherId),
    processParentId(animal.maternal_grandmother_id),
    processParentId(animal.maternal_grandfather_id),
    processParentId(animal.paternal_grandmother_id),
    processParentId(animal.paternal_grandfather_id),
    processParentId(animal.maternal_great_grandmother_maternal_id),
    processParentId(animal.maternal_great_grandfather_maternal_id),
    processParentId(animal.maternal_great_grandmother_paternal_id),
    processParentId(animal.maternal_great_grandfather_paternal_id),
    processParentId(animal.paternal_great_grandmother_maternal_id),
    processParentId(animal.paternal_great_grandfather_maternal_id),
    processParentId(animal.paternal_great_grandmother_paternal_id),
    processParentId(animal.paternal_great_grandfather_paternal_id),
    // Generation 4 - Maternal line
    processParentId((animal as any).gen4_maternal_ggggf_m),
    processParentId((animal as any).gen4_maternal_ggggm_m),
    processParentId((animal as any).gen4_maternal_gggmf_m),
    processParentId((animal as any).gen4_maternal_gggmm_m),
    processParentId((animal as any).gen4_maternal_ggfgf_m),
    processParentId((animal as any).gen4_maternal_ggfgm_m),
    processParentId((animal as any).gen4_maternal_ggmgf_m),
    processParentId((animal as any).gen4_maternal_ggmgm_m),
    // Generation 4 - Paternal line
    processParentId((animal as any).gen4_paternal_ggggf_p),
    processParentId((animal as any).gen4_paternal_ggggm_p),
    processParentId((animal as any).gen4_paternal_gggmf_p),
    processParentId((animal as any).gen4_paternal_gggmm_p),
    processParentId((animal as any).gen4_paternal_ggfgf_p),
    processParentId((animal as any).gen4_paternal_ggfgm_p),
    processParentId((animal as any).gen4_paternal_ggmgf_p),
    processParentId((animal as any).gen4_paternal_ggmgm_p),
    // Generation 5 - Maternal line
    processParentId((animal as any).gen5_maternal_1),
    processParentId((animal as any).gen5_maternal_2),
    processParentId((animal as any).gen5_maternal_3),
    processParentId((animal as any).gen5_maternal_4),
    processParentId((animal as any).gen5_maternal_5),
    processParentId((animal as any).gen5_maternal_6),
    processParentId((animal as any).gen5_maternal_7),
    processParentId((animal as any).gen5_maternal_8),
    processParentId((animal as any).gen5_maternal_9),
    processParentId((animal as any).gen5_maternal_10),
    processParentId((animal as any).gen5_maternal_11),
    processParentId((animal as any).gen5_maternal_12),
    processParentId((animal as any).gen5_maternal_13),
    processParentId((animal as any).gen5_maternal_14),
    processParentId((animal as any).gen5_maternal_15),
    processParentId((animal as any).gen5_maternal_16),
    // Generation 5 - Paternal line
    processParentId((animal as any).gen5_paternal_1),
    processParentId((animal as any).gen5_paternal_2),
    processParentId((animal as any).gen5_paternal_3),
    processParentId((animal as any).gen5_paternal_4),
    processParentId((animal as any).gen5_paternal_5),
    processParentId((animal as any).gen5_paternal_6),
    processParentId((animal as any).gen5_paternal_7),
    processParentId((animal as any).gen5_paternal_8),
    processParentId((animal as any).gen5_paternal_9),
    processParentId((animal as any).gen5_paternal_10),
    processParentId((animal as any).gen5_paternal_11),
    processParentId((animal as any).gen5_paternal_12),
    processParentId((animal as any).gen5_paternal_13),
    processParentId((animal as any).gen5_paternal_14),
    processParentId((animal as any).gen5_paternal_15),
    processParentId((animal as any).gen5_paternal_16)
  ]);

  const [
    motherId, 
    fatherId, 
    maternal_grandmother_id, 
    maternal_grandfather_id, 
    paternal_grandmother_id, 
    paternal_grandfather_id,
    maternal_great_grandmother_maternal_id,
    maternal_great_grandfather_maternal_id,
    maternal_great_grandmother_paternal_id,
    maternal_great_grandfather_paternal_id,
    paternal_great_grandmother_maternal_id,
    paternal_great_grandfather_maternal_id,
    paternal_great_grandmother_paternal_id,
    paternal_great_grandfather_paternal_id,
    // Gen 4 Maternal
    gen4_maternal_ggggf_m,
    gen4_maternal_ggggm_m,
    gen4_maternal_gggmf_m,
    gen4_maternal_gggmm_m,
    gen4_maternal_ggfgf_m,
    gen4_maternal_ggfgm_m,
    gen4_maternal_ggmgf_m,
    gen4_maternal_ggmgm_m,
    // Gen 4 Paternal
    gen4_paternal_ggggf_p,
    gen4_paternal_ggggm_p,
    gen4_paternal_gggmf_p,
    gen4_paternal_gggmm_p,
    gen4_paternal_ggfgf_p,
    gen4_paternal_ggfgm_p,
    gen4_paternal_ggmgf_p,
    gen4_paternal_ggmgm_p,
    // Gen 5 Maternal
    gen5_maternal_1,
    gen5_maternal_2,
    gen5_maternal_3,
    gen5_maternal_4,
    gen5_maternal_5,
    gen5_maternal_6,
    gen5_maternal_7,
    gen5_maternal_8,
    gen5_maternal_9,
    gen5_maternal_10,
    gen5_maternal_11,
    gen5_maternal_12,
    gen5_maternal_13,
    gen5_maternal_14,
    gen5_maternal_15,
    gen5_maternal_16,
    // Gen 5 Paternal
    gen5_paternal_1,
    gen5_paternal_2,
    gen5_paternal_3,
    gen5_paternal_4,
    gen5_paternal_5,
    gen5_paternal_6,
    gen5_paternal_7,
    gen5_paternal_8,
    gen5_paternal_9,
    gen5_paternal_10,
    gen5_paternal_11,
    gen5_paternal_12,
    gen5_paternal_13,
    gen5_paternal_14,
    gen5_paternal_15,
    gen5_paternal_16
  ] = processedAncestors;

  console.log('🔄 Processed all ancestor IDs for update:', {
    motherId,
    fatherId,
    maternal_grandmother_id,
    maternal_grandfather_id,
    paternal_grandmother_id,
    paternal_grandfather_id,
    maternal_great_grandmother_maternal_id,
    maternal_great_grandfather_maternal_id,
    maternal_great_grandmother_paternal_id,
    maternal_great_grandfather_paternal_id,
    paternal_great_grandmother_maternal_id,
    paternal_great_grandfather_maternal_id,
    paternal_great_grandmother_paternal_id,
    paternal_great_grandfather_paternal_id
  });

  const updateData = {
    ...createUpdateObject(animal),
    mother_id: motherId,
    father_id: fatherId,
    maternal_grandmother_id,
    maternal_grandfather_id,
    paternal_grandmother_id,
    paternal_grandfather_id,
    maternal_great_grandmother_maternal_id,
    maternal_great_grandfather_maternal_id,
    maternal_great_grandmother_paternal_id,
    maternal_great_grandfather_paternal_id,
    paternal_great_grandmother_maternal_id,
    paternal_great_grandfather_maternal_id,
    paternal_great_grandmother_paternal_id,
    paternal_great_grandfather_paternal_id,
    // Generation 4 - Maternal line
    gen4_maternal_ggggf_m,
    gen4_maternal_ggggm_m,
    gen4_maternal_gggmf_m,
    gen4_maternal_gggmm_m,
    gen4_maternal_ggfgf_m,
    gen4_maternal_ggfgm_m,
    gen4_maternal_ggmgf_m,
    gen4_maternal_ggmgm_m,
    // Generation 4 - Paternal line
    gen4_paternal_ggggf_p,
    gen4_paternal_ggggm_p,
    gen4_paternal_gggmf_p,
    gen4_paternal_gggmm_p,
    gen4_paternal_ggfgf_p,
    gen4_paternal_ggfgm_p,
    gen4_paternal_ggmgf_p,
    gen4_paternal_ggmgm_p,
    // Generation 5 - Maternal line
    gen5_maternal_1,
    gen5_maternal_2,
    gen5_maternal_3,
    gen5_maternal_4,
    gen5_maternal_5,
    gen5_maternal_6,
    gen5_maternal_7,
    gen5_maternal_8,
    gen5_maternal_9,
    gen5_maternal_10,
    gen5_maternal_11,
    gen5_maternal_12,
    gen5_maternal_13,
    gen5_maternal_14,
    gen5_maternal_15,
    gen5_maternal_16,
    // Generation 5 - Paternal line
    gen5_paternal_1,
    gen5_paternal_2,
    gen5_paternal_3,
    gen5_paternal_4,
    gen5_paternal_5,
    gen5_paternal_6,
    gen5_paternal_7,
    gen5_paternal_8,
    gen5_paternal_9,
    gen5_paternal_10,
    gen5_paternal_11,
    gen5_paternal_12,
    gen5_paternal_13,
    gen5_paternal_14,
    gen5_paternal_15,
    gen5_paternal_16
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
