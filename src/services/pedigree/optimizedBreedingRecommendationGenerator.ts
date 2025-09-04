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
      // Single optimized query to get all breeding-capable animals with minimal pedigree data
      const { data: animals } = await supabase
        .from('animals')
        .select(`
          id, name, species, gender, health_status,
          mother_id, father_id,
          maternal_grandmother_id, maternal_grandfather_id,
          paternal_grandmother_id, paternal_grandfather_id
        `)
        .in('health_status', ['healthy', 'good'])
        .not('gender', 'is', null)
        .eq('lifecycle_status', 'active');

      if (!animals || animals.length < 2) {
        return [];
      }

      const males = animals.filter(a => a.gender === 'male' || a.gender === 'macho');
      const females = animals.filter(a => a.gender === 'female' || a.gender === 'hembra');

      if (males.length === 0 || females.length === 0) {
        return [];
      }

      const recommendations: BreedingRecommendation[] = [];

      // Limit combinations for better performance
      const maxCombinations = Math.min(males.length * females.length, 50);
      let combinationCount = 0;

      for (const male of males) {
        for (const female of females) {
          if (combinationCount >= maxCombinations) break;
          if (male.id === female.id) continue;

          const recommendation = this.analyzeBreedingPairOptimized(male, female, maxDepth);
          if (recommendation) {
            recommendations.push(recommendation);
            combinationCount++;
          }
        }
        if (combinationCount >= maxCombinations) break;
      }

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
    
    // Health status bonus
    if (male.health_status === 'healthy' && female.health_status === 'healthy') {
      score += 30;
    } else if (male.health_status === 'good' && female.health_status === 'good') {
      score += 20;
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