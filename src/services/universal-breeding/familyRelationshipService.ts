
import { supabase } from '@/integrations/supabase/client';
import type { Animal } from '@/stores/animalStore';
import type { FamilyRelationship } from './types';

export class FamilyRelationshipService {
  static async detectFamilyRelationship(animal1: Animal, animal2: Animal): Promise<FamilyRelationship> {
    console.log(`🔍 Checking family relationship between ${animal1.name} and ${animal2.name}`);
    
    try {
      // Get all animals to cross-reference parent names/IDs
      const { data: allAnimals } = await supabase
        .from('animals')
        .select('id, name, mother_id, father_id');

      if (!allAnimals) {
        return { type: 'none', details: 'Unable to verify relationships', shouldBlock: false };
      }

      const animalMap = new Map(allAnimals.map(a => [a.id, a]));
      const nameToIdMap = new Map(allAnimals.map(a => [a.name.toLowerCase(), a.id]));

      // Helper function to resolve parent ID from either UUID or name
      const resolveParentId = (parentValue: string | undefined): string | null => {
        if (!parentValue || parentValue.trim() === '') return null;
        
        // If it's already a UUID and exists in our animal map
        if (animalMap.has(parentValue)) {
          return parentValue;
        }
        
        // Try to find by name (case insensitive)
        const normalizedName = parentValue.toLowerCase().trim();
        return nameToIdMap.get(normalizedName) || null;
      };

      // Handle both camelCase (from store) and snake_case (from database) field names
      const animal1MotherId = resolveParentId(animal1.motherId || (animal1 as any).mother_id);
      const animal1FatherId = resolveParentId(animal1.fatherId || (animal1 as any).father_id);
      const animal2MotherId = resolveParentId(animal2.motherId || (animal2 as any).mother_id);
      const animal2FatherId = resolveParentId(animal2.fatherId || (animal2 as any).father_id);

      console.log(`${animal1.name} parents: mother=${animal1MotherId}, father=${animal1FatherId}`);
      console.log(`${animal2.name} parents: mother=${animal2MotherId}, father=${animal2FatherId}`);
      
      // CRITICAL INCEST CHECK: Log the specific case that was failing
      if (animal1.name === 'CRÍA DE SHIVA Y JAZZ' && animal2.name === 'SHIVA') {
        console.log(`🚨 SPECIFIC INCEST CHECK: CRÍA DE SHIVA Y JAZZ × SHIVA`);
        console.log(`   CRÍA parents: mother=${animal1MotherId}, father=${animal1FatherId}`);
        console.log(`   SHIVA ID: ${animal2.id}`);
        console.log(`   Is SHIVA the mother? ${animal2.id === animal1MotherId}`);
        console.log(`   Is SHIVA the father? ${animal2.id === animal1FatherId}`);
      }

      // Check if one is the parent of the other
      if (animal1.id === animal2MotherId || animal1.id === animal2FatherId) {
        return {
          type: 'parent-child',
          details: `${animal1.name} is the parent of ${animal2.name}`,
          shouldBlock: true
        };
      }

      if (animal2.id === animal1MotherId || animal2.id === animal1FatherId) {
        return {
          type: 'parent-child',
          details: `${animal2.name} is the parent of ${animal1.name}`,
          shouldBlock: true
        };
      }

      // Check if they are siblings (share same mother or father)
      if (animal1MotherId && animal2MotherId && animal1MotherId === animal2MotherId) {
        const motherAnimal = animalMap.get(animal1MotherId);
        return {
          type: 'siblings',
          details: `Both animals share the same mother: ${motherAnimal?.name || 'Unknown'}`,
          shouldBlock: true
        };
      }

      if (animal1FatherId && animal2FatherId && animal1FatherId === animal2FatherId) {
        const fatherAnimal = animalMap.get(animal1FatherId);
        return {
          type: 'siblings',
          details: `Both animals share the same father: ${fatherAnimal?.name || 'Unknown'}`,
          shouldBlock: true
        };
      }

      // Check for grandparent-grandchild relationships
      const animal1Grandparents = [
        resolveParentId(animal1.paternal_grandfather_id),
        resolveParentId(animal1.paternal_grandmother_id),
        resolveParentId(animal1.maternal_grandfather_id),
        resolveParentId(animal1.maternal_grandmother_id)
      ].filter(Boolean);

      if (animal1Grandparents.includes(animal2.id)) {
        return {
          type: 'grandparent-grandchild',
          details: `${animal2.name} is a grandparent of ${animal1.name}`,
          shouldBlock: true
        };
      }

      const animal2Grandparents = [
        resolveParentId(animal2.paternal_grandfather_id),
        resolveParentId(animal2.paternal_grandmother_id),
        resolveParentId(animal2.maternal_grandfather_id),
        resolveParentId(animal2.maternal_grandmother_id)
      ].filter(Boolean);

      if (animal2Grandparents.includes(animal1.id)) {
        return {
          type: 'grandparent-grandchild',
          details: `${animal1.name} is a grandparent of ${animal2.name}`,
          shouldBlock: true
        };
      }

      return { type: 'none', details: 'No direct family relationship detected', shouldBlock: false };

    } catch (error) {
      console.error('Error detecting family relationship:', error);
      return { type: 'none', details: 'Error checking relationships', shouldBlock: false };
    }
  }
}
