
import { supabase } from '@/integrations/supabase/client';
import { animalDatabaseMapper } from '@/services/utils/animalDatabaseMapper';
import type { Animal } from '@/stores/animalStore';

export class BreedingPairsService {
  static async getBreedingPairsBySpecies(species?: string): Promise<{ males: Animal[], females: Animal[] }> {
    console.log(`🐾 Getting breeding pairs${species ? ` for species: ${species}` : ' for all species'} (including all health statuses)...`);
    
    try {
      let query = supabase
        .from('animals')
        .select('*')
        .neq('lifecycle_status', 'deceased'); // Exclude deceased animals

      if (species) {
        query = query.eq('species', species);
      }

      const { data: animals } = await query;

      if (!animals) {
        return { males: [], females: [] };
      }

      const convertedAnimals = animals.map(animal => animalDatabaseMapper.fromDatabase(animal));

      // Enhanced gender filtering with better logging
      const males = convertedAnimals.filter(a => {
        const gender = a.gender?.toLowerCase().trim();
        const isMale = gender === 'male' || gender === 'macho';
        console.log(`🔍 Animal ${a.name} (${a.tag}) - Gender: "${a.gender}" -> Normalized: "${gender}" -> Is Male: ${isMale} - Health: ${a.healthStatus}`);
        return isMale;
      });
      
      const females = convertedAnimals.filter(a => {
        const gender = a.gender?.toLowerCase().trim();
        const isFemale = gender === 'female' || gender === 'hembra';
        console.log(`🔍 Animal ${a.name} (${a.tag}) - Gender: "${a.gender}" -> Normalized: "${gender}" -> Is Female: ${isFemale} - Health: ${a.healthStatus}`);
        return isFemale;
      });

      console.log(`Found ${males.length} males and ${females.length} females (all health statuses included)`);
      console.log('Males:', males.map(m => `${m.name} (${m.gender}, ${m.healthStatus})`));
      console.log('Females:', females.map(f => `${f.name} (${f.gender}, ${f.healthStatus})`));
      
      // Log animals that weren't categorized
      const uncategorized = convertedAnimals.filter(a => {
        const gender = a.gender?.toLowerCase().trim();
        return !(gender === 'male' || gender === 'macho' || gender === 'female' || gender === 'hembra');
      });
      
      if (uncategorized.length > 0) {
        console.log('⚠️ Uncategorized animals (unknown gender):', uncategorized.map(a => `${a.name} (${a.gender || 'undefined'})`));
      }
      
      return { males, females };
    } catch (error) {
      console.error('Error getting breeding pairs:', error);
      return { males: [], females: [] };
    }
  }
}
