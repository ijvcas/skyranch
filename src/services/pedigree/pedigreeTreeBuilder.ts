
import { supabase } from '@/integrations/supabase/client';
import type { PedigreeNode } from './types';

export class PedigreeTreeBuilder {
  
  static async getCompletePedigree(animalId: string): Promise<PedigreeNode | null> {
    console.log('🧬 Getting complete pedigree for animal:', animalId);
    
    try {
      const { data: animal } = await supabase
        .from('animals')
        .select('*')
        .eq('id', animalId)
        .single();

      if (!animal) return null;

      return await this.buildPedigreeTree(animal, 1);
    } catch (error) {
      console.error('Error getting pedigree:', error);
      return null;
    }
  }

  private static async buildPedigreeTree(animal: any, generation: number): Promise<PedigreeNode> {
    const node: PedigreeNode = {
      id: animal.id,
      name: animal.name,
      gender: animal.gender,
      generation,
      isRegistered: true,
      children: []
    };

    // Recursively build parent nodes (up to 4 generations)
    if (generation <= 4) {
      const parents = await this.getParents(animal);
      if (parents.length > 0) {
        for (const parent of parents) {
          const parentNode = await this.buildPedigreeTree(parent, generation + 1);
          node.children?.push(parentNode);
        }
      }
    }

    return node;
  }

  private static async getParents(animal: any): Promise<any[]> {
    const parents = [];
    
    if (animal.mother_id) {
      const mother = await this.resolveParent(animal.mother_id);
      if (mother) parents.push(mother);
    }
    
    if (animal.father_id) {
      const father = await this.resolveParent(animal.father_id);
      if (father) parents.push(father);
    }

    return parents;
  }

  private static async resolveParent(parentId: string): Promise<any | null> {
    // Check if it's a UUID (registered animal)
    if (this.isValidUUID(parentId)) {
      const { data: animal } = await supabase
        .from('animals')
        .select('*')
        .eq('id', parentId)
        .single();
      return animal;
    }
    
    // It's a text name (external animal)
    return {
      id: parentId,
      name: parentId,
      gender: 'unknown',
      species: 'unknown',
      isRegistered: false
    };
  }

  private static isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Get all ancestors from a pedigree node, optionally limiting to a maximum depth
   * @param node The pedigree node to start from
   * @param maxDepth Optional maximum generation depth to include (e.g., 3 = up to great-grandparents)
   * @param ancestors Internal accumulator for recursion
   * @returns Array of all ancestor nodes
   */
  static getAllAncestors(
    node: PedigreeNode, 
    maxDepth?: number,
    ancestors: PedigreeNode[] = []
  ): PedigreeNode[] {
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        // Only include ancestor if within maxDepth (if specified)
        if (!maxDepth || child.generation <= maxDepth) {
          ancestors.push(child);
          this.getAllAncestors(child, maxDepth, ancestors);
        }
      });
    }
    return ancestors;
  }
}
