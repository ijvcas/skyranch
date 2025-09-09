import { supabase } from '@/integrations/supabase/client';
import type { BreedingRecommendation, GeneticDiversityScore, InbreedingAnalysis } from './types';
import type { Animal } from '@/stores/animalStore';

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
      
      // OPTIMIZED: Minimal data query to prevent timeout
      const { data: rawAnimals, error } = await supabase
        .from('animals')
        .select(`
          id, name, species, gender, health_status,
          mother_id, father_id
        `)
        .eq('lifecycle_status', 'active')
        .not('gender', 'is', null)
        .limit(100); // Limit to prevent timeout

      if (error) {
        console.error('❌ Database error:', error);
        return [];
      }

      if (!rawAnimals || rawAnimals.length < 2) {
        console.log('⚠️ Not enough animals found:', rawAnimals?.length || 0);
        return [];
      }

      // Convert to simple format for breeding analysis
      const animals: Animal[] = rawAnimals.map(animal => ({
        id: animal.id,
        name: animal.name,
        tag: animal.name, // Use name as tag for simplicity
        species: animal.species,
        breed: '',
        gender: animal.gender,
        color: '',
        birthDate: '',
        weight: '',
        healthStatus: animal.health_status || 'healthy',
        lifecycleStatus: 'active',
        motherId: animal.mother_id || '',
        fatherId: animal.father_id || '',
        maternalGrandmotherId: '',
        maternalGrandfatherId: '',
        paternalGrandmotherId: '',
        paternalGrandfatherId: '',
        notes: '',
        image: null
      }));


      console.log(`📊 Found ${animals.length} total animals for analysis`);
      
      // First, log ALL animal genders to see what we're working with
      console.log('🔍 All animal genders in database:');
      animals.forEach(animal => {
        console.log(`  - ${animal.name}: gender="${animal.gender}" (raw), species="${animal.species}", health="${animal.healthStatus}"`);
      });
      
      // Normalize gender values and filter with better logging
      const males = animals.filter(a => {
        const gender = a.gender?.toLowerCase().trim();
        const isMale = gender === 'male' || gender === 'macho' || gender === 'm' || gender === 'masculino';
        if (a.gender) {
          console.log(`🔍 ${a.name}: raw="${a.gender}" -> normalized="${gender}" -> isMale=${isMale}`);
        }
        return isMale;
      });
      
      const females = animals.filter(a => {
        const gender = a.gender?.toLowerCase().trim();
        const isFemale = gender === 'female' || gender === 'hembra' || gender === 'f' || gender === 'femenino';
        if (a.gender) {
          console.log(`🔍 ${a.name}: raw="${a.gender}" -> normalized="${gender}" -> isFemale=${isFemale}`);
        }
        return isFemale;
      });

      console.log(`📈 Gender distribution: ${males.length} males, ${females.length} females`);

      if (males.length === 0 || females.length === 0) {
        console.log('❌ Missing gender group - no recommendations possible');
        return [];
      }

      const recommendations: BreedingRecommendation[] = [];

      // Optimize combinations for better performance  
      const maxCombinations = Math.min(males.length * females.length, 20); // Much smaller limit
      
      console.log(`🎯 Processing up to ${maxCombinations} combinations (${males.length} males × ${females.length} females)`);

      let combinationCount = 0;
      let successfulRecommendations = 0;

      // Process fewer combinations more efficiently
      outerLoop: for (let m = 0; m < males.length && combinationCount < maxCombinations; m++) {
        const male = males[m];
        for (let f = 0; f < females.length && combinationCount < maxCombinations; f++) {
          const female = females[f];
          
          if (combinationCount >= maxCombinations) break outerLoop;
          if (male.id === female.id) continue;

          const recommendation = await this.analyzeBreedingPairOptimized(male, female, maxDepth);
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
        .slice(0, 10); // Smaller limit for better performance

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

  private static async analyzeBreedingPairOptimized(
    male: Animal, 
    female: Animal, 
    maxDepth: number
  ): Promise<BreedingRecommendation | null> {
    try {
      // Quick compatibility check based on species
      if (male.species !== female.species) {
        return null; // Skip inter-species breeding for now
      }

      // OPTIMIZED: Check for direct family relationships without database calls
      // This avoids the timeout issue by using data we already have
      console.log(`🔍 Quick family check: ${male.name} (${male.id}) × ${female.name} (${female.id})`);
      
      // Direct parent-child check (CRITICAL for incest prevention)
      if (male.id === female.motherId || male.id === female.fatherId) {
        console.log(`🚫 BLOCKED: ${male.name} is parent of ${female.name}`);
        return null;
      }
      if (female.id === male.motherId || female.id === male.fatherId) {
        console.log(`🚫 BLOCKED: ${female.name} is parent of ${male.name}`);
        return null;
      }
      
      // Sibling check (same parents)
      if (male.motherId && female.motherId && male.motherId === female.motherId) {
        console.log(`🚫 BLOCKED: Siblings - same mother ${male.motherId}`);
        return null;
      }
      if (male.fatherId && female.fatherId && male.fatherId === female.fatherId) {
        console.log(`🚫 BLOCKED: Siblings - same father ${male.fatherId}`);
        return null;
      }
      
      // Special logging for the SHIVA case
      if ((male.name === 'CRÍA DE SHIVA Y JAZZ' && female.name === 'SHIVA') ||
          (female.name === 'CRÍA DE SHIVA Y JAZZ' && male.name === 'SHIVA')) {
        console.log(`🚨 SHIVA TEST: CRÍA mother=${male.name === 'CRÍA DE SHIVA Y JAZZ' ? male.motherId : female.motherId}, SHIVA ID=${female.name === 'SHIVA' ? female.id : male.id}`);
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
    male: Animal, 
    female: Animal, 
    maxDepth: number
  ): 'low' | 'moderate' | 'high' {
    console.log(`🧬 Calculating inbreeding risk for ${male.name} × ${female.name}`);
    console.log(`   Male parents: mother=${male.motherId}, father=${male.fatherId}`);
    console.log(`   Female parents: mother=${female.motherId}, father=${female.fatherId}`);
    
    // CRITICAL: Check for immediate family relationships (these should already be blocked by family service)
    // Parent-Child relationships (INCEST - should be blocked)
    if (male.id === female.motherId || male.id === female.fatherId) {
      console.log(`🚫 CRITICAL: ${male.name} is parent of ${female.name} - INCEST DETECTED!`);
      return 'high';
    }
    if (female.id === male.motherId || female.id === male.fatherId) {
      console.log(`🚫 CRITICAL: ${female.name} is parent of ${male.name} - INCEST DETECTED!`);
      return 'high';
    }
    
    // Sibling relationships (same parents)
    if (male.motherId && female.motherId && male.motherId === female.motherId) {
      console.log(`🚫 SIBLINGS: Both share mother ${male.motherId}`);
      return 'high';
    }
    if (male.fatherId && female.fatherId && male.fatherId === female.fatherId) {
      console.log(`🚫 SIBLINGS: Both share father ${male.fatherId}`);
      return 'high';
    }

    // For mobile (depth 1-2), skip complex grandparent checks
    if (maxDepth <= 2) {
      return 'low';
    }

    // Check grandparent relationships for deeper analysis
    const maleGrandparents = [
      male.maternalGrandmotherId, male.maternalGrandfatherId,
      male.paternalGrandmotherId, male.paternalGrandfatherId
    ].filter(Boolean);

    const femaleGrandparents = [
      female.maternalGrandmotherId, female.maternalGrandfatherId,
      female.paternalGrandmotherId, female.paternalGrandfatherId
    ].filter(Boolean);

    const commonGrandparents = maleGrandparents.filter(gp => femaleGrandparents.includes(gp!));
    
    if (commonGrandparents.length > 0) {
      console.log(`⚠️ Common grandparents detected: ${commonGrandparents.join(', ')}`);
      return 'moderate';
    }
    
    return 'low';
  }

  private static calculateQuickCompatibilityScore(
    male: Animal, 
    female: Animal, 
    inbreedingRisk: 'low' | 'moderate' | 'high'
  ): number {
    let score = 50; // Base score
    
    // Normalize health status values for comparison
    const normalizeHealth = (status: string) => {
      if (!status) return 'unknown';
      const normalized = status.toLowerCase().trim();
      return normalized;
    };
    
    const maleHealth = normalizeHealth(male.healthStatus);
    const femaleHealth = normalizeHealth(female.healthStatus);
    
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
    male: Animal, 
    female: Animal, 
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
    if (male.healthStatus === 'healthy' && female.healthStatus === 'healthy') {
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