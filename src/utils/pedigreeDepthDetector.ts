import { supabase } from '@/integrations/supabase/client';

/**
 * Analyzes an animal's pedigree data and determines the maximum generation depth
 * that contains actual data (not empty strings)
 */
export const detectPedigreeDepth = (animal: any): number => {
  let maxGen = 0;

  // Check Gen 1 (Parents)
  if (animal.father_id || animal.mother_id) {
    maxGen = 1;
  }
  
  // Check Gen 2 (Grandparents)
  if (
    animal.paternal_grandfather_id || 
    animal.paternal_grandmother_id ||
    animal.maternal_grandfather_id || 
    animal.maternal_grandmother_id
  ) {
    maxGen = 2;
  }
  
  // Check Gen 3 (Great-Grandparents)
  if (
    animal.paternal_great_grandfather_paternal_id || 
    animal.paternal_great_grandmother_paternal_id ||
    animal.paternal_great_grandfather_maternal_id ||
    animal.paternal_great_grandmother_maternal_id ||
    animal.maternal_great_grandfather_paternal_id ||
    animal.maternal_great_grandmother_paternal_id ||
    animal.maternal_great_grandfather_maternal_id ||
    animal.maternal_great_grandmother_maternal_id
  ) {
    maxGen = 3;
  }
  
  // Check Gen 4 (16 fields)
  const gen4Fields = [
    'gen4_paternal_ggggf_p', 'gen4_paternal_ggggm_p', 
    'gen4_paternal_gggmf_p', 'gen4_paternal_gggmm_p',
    'gen4_paternal_ggfgf_p', 'gen4_paternal_ggfgm_p', 
    'gen4_paternal_ggmgf_p', 'gen4_paternal_ggmgm_p',
    'gen4_maternal_ggggf_m', 'gen4_maternal_ggggm_m', 
    'gen4_maternal_gggmf_m', 'gen4_maternal_gggmm_m',
    'gen4_maternal_ggfgf_m', 'gen4_maternal_ggfgm_m', 
    'gen4_maternal_ggmgf_m', 'gen4_maternal_ggmgm_m'
  ];
  
  const hasGen4 = gen4Fields.some(field => animal[field]);
  if (hasGen4) {
    maxGen = 4;
  }
  
  // Check Gen 5 (32 fields)
  const hasGen5 = Array.from({ length: 16 }, (_, i) => i + 1).some(i => 
    animal[`gen5_paternal_${i}`] || animal[`gen5_maternal_${i}`]
  );
  if (hasGen5) {
    maxGen = 5;
  }

  // Default to Gen 1 if no data found (at minimum, we should track parents)
  return maxGen || 1;
};

/**
 * Scans all animals in the database and updates their pedigree_max_generation
 * based on actual data present in their pedigree fields
 */
export const detectAndSetAllPedigreeDepths = async (): Promise<{
  updated: number;
  errors: number;
  message: string;
}> => {
  try {
    const { data: animals, error: fetchError } = await supabase
      .from('animals')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    if (!animals || animals.length === 0) {
      return {
        updated: 0,
        errors: 0,
        message: 'No hay animales en la base de datos'
      };
    }

    let updated = 0;
    let errors = 0;

    // Process animals in batches of 50 for better performance
    const batchSize = 50;
    for (let i = 0; i < animals.length; i += batchSize) {
      const batch = animals.slice(i, i + batchSize);
      
      const updates = batch.map(animal => {
        const detectedDepth = detectPedigreeDepth(animal);
        return {
          id: animal.id,
          depth: detectedDepth
        };
      });

      // Update all animals in this batch
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('animals')
          .update({ pedigree_max_generation: update.depth })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Error updating animal ${update.id}:`, updateError);
          errors++;
        } else {
          updated++;
        }
      }
    }

    return {
      updated,
      errors,
      message: `Actualizado: ${updated} animales. Errores: ${errors}`
    };
  } catch (error) {
    console.error('Error detecting pedigree depths:', error);
    return {
      updated: 0,
      errors: 0,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
