/**
 * Wright's Kinship Coefficient Calculator
 * Implements deterministic inbreeding calculations for 5-generation pedigrees
 */

export interface Animal {
  id: string;
  name: string;
  father_id?: string | null;
  mother_id?: string | null;
  paternal_grandfather_id?: string | null;
  paternal_grandmother_id?: string | null;
  maternal_grandfather_id?: string | null;
  maternal_grandmother_id?: string | null;
  paternal_great_grandfather_paternal_id?: string | null;
  paternal_great_grandmother_paternal_id?: string | null;
  paternal_great_grandfather_maternal_id?: string | null;
  paternal_great_grandmother_maternal_id?: string | null;
  maternal_great_grandfather_paternal_id?: string | null;
  maternal_great_grandmother_paternal_id?: string | null;
  maternal_great_grandfather_maternal_id?: string | null;
  maternal_great_grandmother_maternal_id?: string | null;
}

export interface CommonAncestor {
  name: string;
  generations: number;
  relationshipPath: string;
}

export interface KinshipResult {
  coefficient: number;
  inbreedingPercentage: number;
  commonAncestors: CommonAncestor[];
  riskLevel: 'low' | 'moderate' | 'high';
}

export class WrightInbreedingCalculator {
  /**
   * Build complete ancestor tree from database animal record
   * Returns Map<ancestorName, generationLevel>
   */
  static buildAncestorTree(animal: Animal, allAnimals?: Map<string, Animal>): Map<string, number> {
    const ancestors = new Map<string, number>();
    
    // Generation 1: Parents
    this.addAncestor(ancestors, animal.father_id, 1);
    this.addAncestor(ancestors, animal.mother_id, 1);
    
    // Generation 2: Grandparents
    this.addAncestor(ancestors, animal.paternal_grandfather_id, 2);
    this.addAncestor(ancestors, animal.paternal_grandmother_id, 2);
    this.addAncestor(ancestors, animal.maternal_grandfather_id, 2);
    this.addAncestor(ancestors, animal.maternal_grandmother_id, 2);
    
    // Generation 3: Great-grandparents (8 animals)
    this.addAncestor(ancestors, animal.paternal_great_grandfather_paternal_id, 3);
    this.addAncestor(ancestors, animal.paternal_great_grandmother_paternal_id, 3);
    this.addAncestor(ancestors, animal.paternal_great_grandfather_maternal_id, 3);
    this.addAncestor(ancestors, animal.paternal_great_grandmother_maternal_id, 3);
    this.addAncestor(ancestors, animal.maternal_great_grandfather_paternal_id, 3);
    this.addAncestor(ancestors, animal.maternal_great_grandmother_paternal_id, 3);
    this.addAncestor(ancestors, animal.maternal_great_grandfather_maternal_id, 3);
    this.addAncestor(ancestors, animal.maternal_great_grandmother_maternal_id, 3);
    
    return ancestors;
  }

  /**
   * Calculate Wright's kinship coefficient
   * F = Σ(1/2)^(n1 + n2 + 1) for each common ancestor
   * where n1 and n2 are generation distances from each parent
   */
  static calculateKinshipCoefficient(
    ancestors1: Map<string, number>,
    ancestors2: Map<string, number>
  ): KinshipResult {
    const commonAncestors: CommonAncestor[] = [];
    let totalCoefficient = 0;
    
    for (const [ancestorName, gen1] of ancestors1) {
      if (ancestors2.has(ancestorName)) {
        const gen2 = ancestors2.get(ancestorName)!;
        const pathLength = gen1 + gen2;
        const contribution = Math.pow(0.5, pathLength + 1);
        
        totalCoefficient += contribution;
        
        commonAncestors.push({
          name: ancestorName,
          generations: Math.min(gen1, gen2),
          relationshipPath: this.getRelationshipPath(gen1, gen2)
        });
      }
    }
    
    const inbreedingPercentage = totalCoefficient * 100;
    
    let riskLevel: 'low' | 'moderate' | 'high';
    if (inbreedingPercentage < 3) {
      riskLevel = 'low';
    } else if (inbreedingPercentage < 8) {
      riskLevel = 'moderate';
    } else {
      riskLevel = 'high';
    }
    
    return {
      coefficient: totalCoefficient,
      inbreedingPercentage,
      commonAncestors,
      riskLevel
    };
  }

  /**
   * Normalize animal name for matching
   * Removes accents, special characters, and normalizes case
   */
  static normalizeName(name: string | null | undefined): string {
    if (!name) return '';
    return name.trim().toUpperCase()
      .replace(/[àáâãäå]/gi, 'A')
      .replace(/[èéêë]/gi, 'E')
      .replace(/[ìíîï]/gi, 'I')
      .replace(/[òóôõö]/gi, 'O')
      .replace(/[ùúûü]/gi, 'U')
      .replace(/[ñ]/gi, 'N')
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ');
  }

  /**
   * Add ancestor to tree with normalized name
   */
  private static addAncestor(
    ancestors: Map<string, number>,
    name: string | null | undefined,
    generation: number
  ): void {
    if (!name) return;
    const normalized = this.normalizeName(name);
    if (normalized) {
      // Keep the minimum generation (closest to subject)
      if (!ancestors.has(normalized) || ancestors.get(normalized)! > generation) {
        ancestors.set(normalized, generation);
      }
    }
  }

  /**
   * Generate human-readable relationship path description
   */
  private static getRelationshipPath(gen1: number, gen2: number): string {
    const desc1 = this.getGenerationDescription(gen1);
    const desc2 = this.getGenerationDescription(gen2);
    return `${desc1} - ${desc2}`;
  }

  /**
   * Get Spanish description for generation level
   */
  private static getGenerationDescription(generation: number): string {
    switch (generation) {
      case 1: return 'Padre/Madre';
      case 2: return 'Abuelo/a';
      case 3: return 'Bisabuelo/a';
      case 4: return 'Tatarabuelo/a';
      case 5: return 'Tras-tatarabuelo/a';
      default: return `Generación ${generation}`;
    }
  }

  /**
   * Analyze potential pairing between two animals
   */
  static analyzePairing(animal1: Animal, animal2: Animal): KinshipResult {
    const ancestors1 = this.buildAncestorTree(animal1);
    const ancestors2 = this.buildAncestorTree(animal2);
    return this.calculateKinshipCoefficient(ancestors1, ancestors2);
  }

  /**
   * Get recommendation text based on inbreeding coefficient
   */
  static getRecommendationText(result: KinshipResult): string {
    if (result.riskLevel === 'low') {
      return 'Emparejamiento seguro con bajo riesgo de consanguinidad. Recomendado para preservar la genética.';
    } else if (result.riskLevel === 'moderate') {
      return 'Riesgo moderado de consanguinidad. Aceptable con monitoreo veterinario y evaluación genética.';
    } else {
      return 'Alto riesgo de consanguinidad. NO recomendado. Buscar alternativas con mejor diversidad genética.';
    }
  }
}
