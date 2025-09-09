import { supabase } from '@/integrations/supabase/client';
import type { BreedingRecommendation, GeneticDiversityScore, InbreedingAnalysis } from './types';
import { useIsMobile } from '@/hooks/use-mobile';

interface OptimizedAnimal {
  id: string;
  name: string;
  species: string;
  gender: string;
  health_status: string;
  mother_id?: string;
  father_id?: string;
  // Minimal pedigree data for mobile
  maternal_grandmother_id?: string;
  maternal_grandfather_id?: string;
  paternal_grandmother_id?: string;
  paternal_grandfather_id?: string;
}

export class OptimizedBreedingRecommendationGenerator {
  private static cache: Map<string, { data: BreedingRecommendation[], timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  static async generateBreedingRecommendations(maxDepth: number = 2): Promise<BreedingRecommendation[]> {
    console.log('🚀 Generating optimized breeding recommendations with depth:', maxDepth);
    
    const cacheKey = `recommendations_${maxDepth}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if available and not expired
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📋 Returning cached breeding recommendations');
      return cached.data;
    }

    try {
      console.log('🔍 Fetching animals for breeding recommendations...');
      
      // Single optimized query to get all breeding-capable animals with minimal pedigree data
      const { data: animals, error } = await supabase
        .from('animals')
        .select(`
          id, name, species, gender, health_status,
          mother_id, father_id,
          maternal_grandmother_id, maternal_grandfather_id,
          paternal_grandmother_id, paternal_grandfather_id
        `)
        .neq('lifecycle_status', 'deceased') // Exclude deceased animals
        .not('gender', 'is', null);

      if (error) {
        console.error('❌ Database error:', error);
        return [];
      }

      if (!animals || animals.length < 2) {
        console.log('⚠️ Not enough animals found:', animals?.length || 0);
        return [];
      }

      console.log(`📊 Found ${animals.length} total animals for analysis`);
      
      // Normalize gender values and filter with better logging
      const males = animals.filter(a => {
        const gender = a.gender?.toLowerCase().trim();
        const isMale = gender === 'male' || gender === 'macho';
        if (isMale) {
          console.log(`♂️ Male found: ${a.name} (${a.species}) - Health: ${a.health_status}`);
        }
        return isMale;
      });
      
      const females = animals.filter(a => {
        const gender = a.gender?.toLowerCase().trim();
        const isFemale = gender === 'female' || gender === 'hembra';
        if (isFemale) {
          console.log(`♀️ Female found: ${a.name} (${a.species}) - Health: ${a.health_status}`);
        }
        return isFemale;
      });

      console.log(`📈 Gender distribution: ${males.length} males, ${females.length} females`);

      if (males.length === 0 || females.length === 0) {
        console.log('❌ Missing gender group - no recommendations possible');
        return [];
      }

      const recommendations: BreedingRecommendation[] = [];

      // Optimize combinations based on device capabilities
      const maxMales = Math.min(males.length, maxDepth <= 2 ? 8 : 12);
      const maxFemales = Math.min(females.length, maxDepth <= 2 ? 8 : 12);
      const maxCombinations = Math.min(maxMales * maxFemales, maxDepth <= 2 ? 25 : 50);
      
      console.log(`🎯 Processing up to ${maxCombinations} combinations (${maxMales} males × ${maxFemales} females)`);

      let combinationCount = 0;
      let successfulRecommendations = 0;

      // Process combinations more efficiently
      outerLoop: for (let m = 0; m < maxMales && m < males.length; m++) {
        const male = males[m];
        for (let f = 0; f < maxFemales && f < females.length; f++) {
          const female = females[f];
          
          if (combinationCount >= maxCombinations) break outerLoop;
          if (male.id === female.id) continue;

          const recommendation = this.analyzeBreedingPairOptimized(male, female, maxDepth);
          if (recommendation) {
            recommendations.push(recommendation);
            successfulRecommendations++;
          }
          combinationCount++;
        }
      }

      console.log(`✅ Processed ${combinationCount} combinations, generated ${successfulRecommendations} recommendations`);

      // Sort by compatibility score (highest first) and limit results
      const sortedRecommendations = recommendations
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, 20); // Limit to top 20 recommendations

      // Cache the results
      this.cache.set(cacheKey, {
        data: sortedRecommendations,
        timestamp: Date.now()
      });

      console.log(`✅ Generated ${sortedRecommendations.length} optimized breeding recommendations`);
      return sortedRecommendations;
    } catch (error) {
      console.error('❌ Error generating optimized breeding recommendations:', error);
      return [];
    }
  }

  private static analyzeBreedingPairOptimized(
    male: OptimizedAnimal, 
    female: OptimizedAnimal, 
    maxDepth: number
  ): BreedingRecommendation | null {
    try {
      // Quick compatibility check based on species
      if (male.species !== female.species) {
        return null; // Skip inter-species breeding for now
      }

      // Calculate simplified inbreeding risk using limited pedigree data
      const inbreedingRisk = this.calculateSimplifiedInbreedingRisk(male, female, maxDepth);
      
      // Calculate basic genetic diversity score
      const compatibilityScore = this.calculateQuickCompatibilityScore(male, female, inbreedingRisk);
      
      // Generate basic recommendations
      const recommendations = this.generateQuickRecommendations(male, female, inbreedingRisk, compatibilityScore);

      return {
        id: `${male.id}-${female.id}`,
        maleId: male.id,
        maleName: male.name,
        femaleId: female.id,
        femaleName: female.name,
        compatibilityScore,
        geneticDiversityGain: Math.round(compatibilityScore * 0.8), // Simplified calculation
        inbreedingRisk,
        recommendations: recommendations.slice(0, 3),
        reasoning: recommendations.slice(3)
      };
    } catch (error) {
      console.error('❌ Error analyzing breeding pair:', error);
      return null;
    }
  }

  private static calculateSimplifiedInbreedingRisk(
    male: OptimizedAnimal, 
    female: OptimizedAnimal, 
    maxDepth: number
  ): 'low' | 'moderate' | 'high' {
    // Quick checks for immediate family relationships
    if (male.mother_id === female.mother_id && male.mother_id) return 'high';
    if (male.father_id === female.father_id && male.father_id) return 'high';
    if (male.id === female.mother_id || male.id === female.father_id) return 'high';
    if (female.id === male.mother_id || female.id === male.father_id) return 'high';

    // For mobile (depth 1-2), skip complex grandparent checks
    if (maxDepth <= 2) {
      return 'low';
    }

    // Check grandparent relationships for deeper analysis
    const maleGrandparents = [
      male.maternal_grandmother_id, male.maternal_grandfather_id,
      male.paternal_grandmother_id, male.paternal_grandfather_id
    ].filter(Boolean);

    const femaleGrandparents = [
      female.maternal_grandmother_id, female.maternal_grandfather_id,
      female.paternal_grandmother_id, female.paternal_grandfather_id
    ].filter(Boolean);

    const commonGrandparents = maleGrandparents.filter(gp => femaleGrandparents.includes(gp!));
    
    if (commonGrandparents.length > 0) return 'moderate';
    
    return 'low';
  }

  private static calculateQuickCompatibilityScore(
    male: OptimizedAnimal, 
    female: OptimizedAnimal, 
    inbreedingRisk: 'low' | 'moderate' | 'high'
  ): number {
    let score = 50; // Base score
    
    // Normalize health status values for comparison
    const normalizeHealth = (status: string) => {
      if (!status) return 'unknown';
      const normalized = status.toLowerCase().trim();
      return normalized;
    };
    
    const maleHealth = normalizeHealth(male.health_status);
    const femaleHealth = normalizeHealth(female.health_status);
    
    // Health status bonus (more flexible matching)
    if (maleHealth === 'healthy' && femaleHealth === 'healthy') {
      score += 30;
    } else if ((maleHealth === 'healthy' || maleHealth === 'good') && 
               (femaleHealth === 'healthy' || femaleHealth === 'good')) {
      score += 20;
    } else if (maleHealth !== 'sick' && femaleHealth !== 'sick' && 
               maleHealth !== 'treatment' && femaleHealth !== 'treatment') {
      score += 10; // Both animals are at least stable
    }
    
    // Inbreeding risk penalty
    switch (inbreedingRisk) {
      case 'low': score += 20; break;
      case 'moderate': score -= 10; break;
      case 'high': score -= 40; break;
    }
    
    // Species match bonus
    if (male.species === female.species) {
      score += 10;
    }
    
    // Penalize if either animal is sick or in treatment
    if (maleHealth === 'sick' || femaleHealth === 'sick') {
      score -= 20;
    }
    if (maleHealth === 'treatment' || femaleHealth === 'treatment') {
      score -= 15;
    }
    
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  private static generateQuickRecommendations(
    male: OptimizedAnimal, 
    female: OptimizedAnimal, 
    inbreedingRisk: 'low' | 'moderate' | 'high',
    compatibilityScore: number
  ): string[] {
    const recommendations = [];
    
    // Inbreeding assessment
    if (inbreedingRisk === 'low') {
      recommendations.push('✅ Excelente compatibilidad genética');
    } else if (inbreedingRisk === 'moderate') {
      recommendations.push('⚡ Compatibilidad moderada - monitorear descendencia');
    } else {
      recommendations.push('⚠️ Riesgo alto de consanguinidad - no recomendado');
    }

    // Compatibility assessment
    if (compatibilityScore > 80) {
      recommendations.push('🌟 Alta compatibilidad esperada');
    } else if (compatibilityScore > 60) {
      recommendations.push('📈 Compatibilidad buena');
    } else {
      recommendations.push('📉 Compatibilidad limitada');
    }

    // Health status
    if (male.health_status === 'healthy' && female.health_status === 'healthy') {
      recommendations.push('💪 Ambos animales en excelente estado de salud');
    }

    // Additional context
    recommendations.push(`Macho: ${male.name} (${male.species})`);
    recommendations.push(`Hembra: ${female.name} (${female.species})`);
    recommendations.push(`Análisis optimizado para rendimiento móvil`);

    return recommendations;
  }

  // Clear cache manually if needed
  static clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Breeding recommendations cache cleared');
  }
}