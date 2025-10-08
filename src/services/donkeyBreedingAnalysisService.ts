import { supabase } from '@/integrations/supabase/client';
import { animalDatabaseMapper } from '@/services/utils/animalDatabaseMapper';
import type { Animal } from '@/stores/animalStore';

export interface DonkeyPedigreeAnalysis {
  maleId: string;
  maleName: string;
  femaleId: string;
  femaleName: string;
  compatibilityScore: number;
  inbreedingCoefficient: number;
  riskLevel: 'low' | 'moderate' | 'high';
  commonAncestors: string[];
  geneticDiversityScore: number;
  recommendations: string[];
  frenchLineageAnalysis: {
    maleLineage: string[];
    femaleLineage: string[];
    lineageDiversity: number;
  };
}

export interface DonkeyBreedingRecommendation {
  pairId: string;
  maleName: string;
  femaleName: string;
  compatibilityScore: number;
  breedingWindow: string;
  seasonalAdvice: string[];
  geneticBenefits: string[];
  considerations: string[];
}

export class DonkeyBreedingAnalysisService {
  
  static async getDonkeyPairs(): Promise<{ males: Animal[], females: Animal[] }> {
    console.log('🐴 Getting donkey breeding pairs...');
    
    try {
      const { data: animals } = await supabase
        .from('animals')
        .select('*')
        .eq('species', 'equino')
        .neq('lifecycle_status', 'deceased') // Exclude deceased animals
        .in('health_status', ['healthy', 'good']);

      if (!animals) {
        return { males: [], females: [] };
      }

      // Convert database format to Animal format
      const convertedAnimals = animals.map(animal => animalDatabaseMapper.fromDatabase(animal));

      const males = convertedAnimals.filter(a => a.gender === 'male' || a.gender === 'macho');
      const females = convertedAnimals.filter(a => a.gender === 'female' || a.gender === 'hembra');

      console.log(`Found ${males.length} male donkeys and ${females.length} female donkeys`);
      return { males, females };
    } catch (error) {
      console.error('Error getting donkey pairs:', error);
      return { males: [], females: [] };
    }
  }

  static async analyzeDonkeyPair(male: Animal, female: Animal): Promise<DonkeyPedigreeAnalysis> {
    console.log(`🧬 Analyzing donkey pair: ${male.name} x ${female.name}`);
    
    // Extract French lineage from pedigree fields
    const maleLineage = this.extractFrenchLineage(male);
    const femaleLineage = this.extractFrenchLineage(female);
    
    // Find common ancestors
    const commonAncestors = this.findCommonAncestors(maleLineage, femaleLineage);
    
    // Calculate inbreeding coefficient
    const inbreedingCoefficient = this.calculateInbreedingCoefficient(commonAncestors, maleLineage, femaleLineage);
    
    // Determine risk level
    const riskLevel = inbreedingCoefficient > 0.125 ? 'high' : 
                     inbreedingCoefficient > 0.0625 ? 'moderate' : 'low';
    
    // Calculate genetic diversity
    const geneticDiversityScore = this.calculateGeneticDiversity(maleLineage, femaleLineage, commonAncestors);
    
    // Calculate compatibility score
    const compatibilityScore = this.calculateCompatibilityScore(inbreedingCoefficient, geneticDiversityScore, maleLineage, femaleLineage);
    
    // Generate recommendations
    const recommendations = this.generateDonkeyRecommendations(male, female, riskLevel, geneticDiversityScore, commonAncestors);
    
    return {
      maleId: male.id,
      maleName: male.name,
      femaleId: female.id,
      femaleName: female.name,
      compatibilityScore,
      inbreedingCoefficient,
      riskLevel,
      commonAncestors,
      geneticDiversityScore,
      recommendations,
      frenchLineageAnalysis: {
        maleLineage,
        femaleLineage,
        lineageDiversity: this.calculateLineageDiversity(maleLineage, femaleLineage)
      }
    };
  }

  private static extractFrenchLineage(animal: Animal): string[] {
    const lineage: string[] = [];
    
    // Extract all pedigree information using the correct Animal properties
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
        // Clean up French names (remove extra spaces, normalize)
        const cleanName = field.trim().toUpperCase();
        if (!lineage.includes(cleanName)) {
          lineage.push(cleanName);
        }
      }
    });

    return lineage;
  }

  private static findCommonAncestors(maleLineage: string[], femaleLineage: string[]): string[] {
    return maleLineage.filter(ancestor => femaleLineage.includes(ancestor));
  }

  private static calculateInbreedingCoefficient(commonAncestors: string[], maleLineage: string[], femaleLineage: string[]): number {
    if (commonAncestors.length === 0) return 0;
    
    // Simplified Wright's coefficient calculation
    // For each common ancestor, add (1/2)^(n+m) where n and m are path lengths
    let coefficient = 0;
    
    commonAncestors.forEach(ancestor => {
      // Simplified: assume each common ancestor contributes 0.0625 (1/16) to inbreeding
      coefficient += 0.0625;
    });
    
    return Math.min(coefficient, 0.5); // Cap at 50%
  }

  private static calculateGeneticDiversity(maleLineage: string[], femaleLineage: string[], commonAncestors: string[]): number {
    const totalUniqueAncestors = new Set([...maleLineage, ...femaleLineage]).size;
    const totalAncestors = maleLineage.length + femaleLineage.length;
    const diversityRatio = totalAncestors > 0 ? totalUniqueAncestors / totalAncestors : 0;
    
    // Penalize for common ancestors
    const commonPenalty = commonAncestors.length * 0.1;
    
    return Math.max(0, Math.min(100, (diversityRatio * 100) - (commonPenalty * 10)));
  }

  private static calculateLineageDiversity(maleLineage: string[], femaleLineage: string[]): number {
    const combinedLineage = [...maleLineage, ...femaleLineage];
    const uniqueLineage = new Set(combinedLineage);
    
    return combinedLineage.length > 0 ? (uniqueLineage.size / combinedLineage.length) * 100 : 0;
  }

  private static calculateCompatibilityScore(inbreedingCoeff: number, geneticDiversity: number, maleLineage: string[], femaleLineage: string[]): number {
    // Base score from genetic diversity (40% weight)
    let score = geneticDiversity * 0.4;
    
    // Inbreeding penalty (40% weight)
    const inbreedingScore = Math.max(0, 100 - (inbreedingCoeff * 800)); // Heavy penalty for inbreeding
    score += inbreedingScore * 0.4;
    
    // Lineage completeness bonus (20% weight)
    const completenessScore = Math.min(100, (maleLineage.length + femaleLineage.length) * 7.5);
    score += completenessScore * 0.2;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private static generateDonkeyRecommendations(
    male: Animal, 
    female: Animal, 
    riskLevel: 'low' | 'moderate' | 'high', 
    geneticDiversity: number, 
    commonAncestors: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Risk-based recommendations
    if (riskLevel === 'low') {
      recommendations.push('✅ Excelente compatibilidad genética para burros franceses');
      recommendations.push('🌟 Apareamiento recomendado - bajo riesgo de consanguinidad');
    } else if (riskLevel === 'moderate') {
      recommendations.push('⚠️ Consanguinidad moderada detectada');
      recommendations.push('🔍 Recomendado hacer análisis genético antes del apareamiento');
    } else {
      recommendations.push('🚫 Alto riesgo de consanguinidad - apareamiento no recomendado');
      recommendations.push('📋 Buscar otros donkeys con linajes franceses diferentes');
    }

    // Genetic diversity recommendations
    if (geneticDiversity > 75) {
      recommendations.push('🧬 Excelente diversidad genética esperada en la descendencia');
    } else if (geneticDiversity > 50) {
      recommendations.push('📈 Buena diversidad genética, descendencia saludable esperada');
    } else {
      recommendations.push('📉 Diversidad genética limitada - considerar otros apareamientos');
    }

    // French lineage specific advice
    recommendations.push('🇫🇷 Mantendrá las características del burro francés de calidad');
    
    // Common ancestors warning
    if (commonAncestors.length > 0) {
      recommendations.push(`⚠️ Ancestros comunes detectados: ${commonAncestors.slice(0, 2).join(', ')}`);
    }

    // Seasonal advice for donkeys
    recommendations.push('📅 Mejor época de apareamiento: primavera (marzo-mayo)');
    recommendations.push('🤱 Gestación esperada: 12-14 meses para burros');

    return recommendations;
  }

  static async generateDonkeyBreedingRecommendations(): Promise<DonkeyBreedingRecommendation[]> {
    console.log('💡 Generating donkey-specific breeding recommendations...');
    
    try {
      const { males, females } = await this.getDonkeyPairs();
      
      if (males.length === 0 || females.length === 0) {
        return [];
      }

      const recommendations: DonkeyBreedingRecommendation[] = [];

      // Analyze all possible donkey pairs
      for (const male of males) {
        for (const female of females) {
          const analysis = await this.analyzeDonkeyPair(male, female);
          
          const recommendation: DonkeyBreedingRecommendation = {
            pairId: `${male.id}-${female.id}`,
            maleName: male.name,
            femaleName: female.name,
            compatibilityScore: analysis.compatibilityScore,
            breedingWindow: 'Marzo - Mayo (primavera)',
            seasonalAdvice: [
              'Evitar apareamientos en pleno verano por el calor',
              'La primavera ofrece mejores condiciones para gestación',
              'Planificar nacimiento para primavera siguiente'
            ],
            geneticBenefits: [
              `Diversidad genética: ${analysis.geneticDiversityScore.toFixed(1)}%`,
              'Preservación del linaje francés de calidad',
              analysis.riskLevel === 'low' ? 'Bajo riesgo genético' : 'Monitoreo genético recomendado'
            ],
            considerations: analysis.recommendations.slice(0, 3)
          };

          recommendations.push(recommendation);
        }
      }

      // Sort by compatibility score
      return recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    } catch (error) {
      console.error('Error generating donkey breeding recommendations:', error);
      return [];
    }
  }
}
