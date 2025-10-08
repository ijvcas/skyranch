
import type { Animal } from '@/stores/animalStore';

export class GeneticCalculatorService {
  static extractLineage(animal: Animal): string[] {
    const lineage: string[] = [];
    
    const pedigreeFields = [
      animal.fatherId,
      animal.motherId,
      animal.paternal_grandfather_id,
      animal.paternal_grandmother_id,
      animal.maternal_grandfather_id,
      animal.maternal_grandmother_id,
      animal.paternal_great_grandfather_paternal_id,
      animal.paternal_great_grandmother_paternal_id,
      animal.paternal_great_grandfather_maternal_id,
      animal.paternal_great_grandmother_maternal_id,
      animal.maternal_great_grandfather_paternal_id,
      animal.maternal_great_grandmother_paternal_id,
      animal.maternal_great_grandfather_maternal_id,
      animal.maternal_great_grandmother_maternal_id
    ];

    pedigreeFields.forEach(field => {
      if (field && typeof field === 'string' && field.trim()) {
        const cleanName = field.trim().toUpperCase();
        if (!lineage.includes(cleanName)) {
          lineage.push(cleanName);
        }
      }
    });

    return lineage;
  }

  static findCommonAncestors(maleLineage: string[], femaleLineage: string[]): string[] {
    return maleLineage.filter(ancestor => femaleLineage.includes(ancestor));
  }

  static calculateInbreedingCoefficient(commonAncestors: string[], maleLineage: string[], femaleLineage: string[]): number {
    if (commonAncestors.length === 0) return 0;
    
    let coefficient = 0;
    commonAncestors.forEach(ancestor => {
      coefficient += 0.0625; // Standard coefficient for shared ancestors
    });
    
    return Math.min(coefficient, 0.5);
  }

  static calculateImprovedGeneticDiversity(
    male: Animal, 
    female: Animal, 
    maleLineage: string[], 
    femaleLineage: string[], 
    commonAncestors: string[]
  ): number {
    // If both animals have no or minimal pedigree data, assume high genetic diversity
    if (maleLineage.length === 0 && femaleLineage.length === 0) {
      console.log('Both animals have no pedigree data - assuming high genetic diversity');
      return 85; // High diversity when no lineage conflicts are known
    }

    // If only one has pedigree data, assume moderate to high diversity
    if (maleLineage.length === 0 || femaleLineage.length === 0) {
      console.log('Only one animal has pedigree data - assuming good genetic diversity');
      return 75; // Good diversity when only partial data available
    }

    // Calculate diversity based on known lineage
    const totalUniqueAncestors = new Set([...maleLineage, ...femaleLineage]).size;
    const totalAncestors = maleLineage.length + femaleLineage.length;
    const diversityRatio = totalAncestors > 0 ? totalUniqueAncestors / totalAncestors : 1;
    
    // Penalize for common ancestors
    const commonPenalty = commonAncestors.length * 15; // Increased penalty for common ancestors
    
    const baseScore = diversityRatio * 100;
    const finalScore = Math.max(20, baseScore - commonPenalty); // Minimum score of 20%
    
    console.log(`Genetic diversity calculation: base=${baseScore.toFixed(1)}, penalty=${commonPenalty}, final=${finalScore.toFixed(1)}`);
    
    return Math.min(100, finalScore);
  }

  static calculateEnhancedCompatibilityScore(
    male: Animal,
    female: Animal,
    inbreedingCoeff: number, 
    geneticDiversity: number, 
    maleLineage: string[], 
    femaleLineage: string[],
    species: string
  ): number {
    console.log(`Calculating compatibility for ${male.name} (${male.breed || 'no breed'}) x ${female.name} (${female.breed || 'no breed'})`);
    
    let score = 0;
    
    // Base genetic diversity component (40% weight)
    const diversityScore = geneticDiversity * 0.4;
    score += diversityScore;
    
    // Inbreeding risk component (30% weight)
    const inbreedingScore = Math.max(0, 100 - (inbreedingCoeff * 800)) * 0.3;
    score += inbreedingScore;
    
    // Special breed preservation bonus (20% weight)
    let breedBonus = 0;
    const specialBreeds = ['baudet de poitou', 'nez noir du valais'];
    const maleBreedLower = (male.breed || '').toLowerCase();
    const femaleBreedLower = (female.breed || '').toLowerCase();
    
    // Same special breed bonus
    if (maleBreedLower && femaleBreedLower && maleBreedLower === femaleBreedLower) {
      if (specialBreeds.some(breed => maleBreedLower.includes(breed))) {
        breedBonus = 90; // High bonus for same special breed
        console.log(`Special breed match bonus: ${maleBreedLower}`);
      } else {
        breedBonus = 70; // Good bonus for same regular breed
      }
    } else if (specialBreeds.some(breed => maleBreedLower.includes(breed) || femaleBreedLower.includes(breed))) {
      breedBonus = 60; // Moderate bonus for one special breed
    } else {
      breedBonus = 50; // Base score for different or unknown breeds
    }
    
    score += breedBonus * 0.2;
    
    // Pedigree completeness bonus (10% weight)
    const avgLineageDepth = (maleLineage.length + femaleLineage.length) / 2;
    const completenessScore = Math.min(100, avgLineageDepth * 12.5) * 0.1; // Max at 8 ancestors
    score += completenessScore;
    
    const finalScore = Math.round(Math.max(0, Math.min(100, score)));
    
    console.log(`Compatibility breakdown: diversity=${diversityScore.toFixed(1)}, inbreeding=${inbreedingScore.toFixed(1)}, breed=${(breedBonus * 0.2).toFixed(1)}, completeness=${completenessScore.toFixed(1)}, final=${finalScore}`);
    
    return finalScore;
  }
}
