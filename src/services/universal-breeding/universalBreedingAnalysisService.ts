
import { SpeciesConfigService } from '@/services/species/speciesConfig';
import type { Animal } from '@/stores/animalStore';
import type { UniversalPedigreeAnalysis, UniversalBreedingRecommendation } from './types';
import { BreedingPairsService } from './breedingPairsService';
import { FamilyRelationshipService } from './familyRelationshipService';
import { GeneticCalculatorService } from './geneticCalculatorService';
import { RecommendationService } from './recommendationService';

export class UniversalBreedingAnalysisService {
  static async getBreedingPairsBySpecies(species?: string): Promise<{ males: Animal[], females: Animal[] }> {
    return BreedingPairsService.getBreedingPairsBySpecies(species);
  }

  static async detectFamilyRelationship(animal1: Animal, animal2: Animal) {
    return FamilyRelationshipService.detectFamilyRelationship(animal1, animal2);
  }

  static async analyzeUniversalPair(male: Animal, female: Animal): Promise<UniversalPedigreeAnalysis> {
    console.log(`🧬 Analyzing universal pair: ${male.name} (${male.species}, ${male.gender}) x ${female.name} (${female.species}, ${female.gender})`);
    
    // Validate that we have male x female pairing
    const maleGender = male.gender?.toLowerCase().trim();
    const femaleGender = female.gender?.toLowerCase().trim();
    const isMale = maleGender === 'male' || maleGender === 'macho';
    const isFemale = femaleGender === 'female' || femaleGender === 'hembra';
    
    if (!isMale || !isFemale) {
      throw new Error(`Invalid breeding pair: ${male.name} (${male.gender}) x ${female.name} (${female.gender}). Only male x female pairings are allowed.`);
    }
    
    // Ensure same species
    if (male.species !== female.species) {
      throw new Error('Cannot analyze cross-species breeding');
    }

    // Check for family relationships first
    const familyRelationship = await this.detectFamilyRelationship(male, female);
    
    if (familyRelationship.shouldBlock) {
      console.log(`❌ Blocking breeding pair due to family relationship: ${familyRelationship.details}`);
      return {
        maleId: male.id,
        maleName: male.name,
        femaleId: female.id,
        femaleName: female.name,
        species: male.species,
        compatibilityScore: 0,
        inbreedingCoefficient: 1.0,
        riskLevel: 'high',
        commonAncestors: [],
        geneticDiversityScore: 0,
        recommendations: [
          '🚫 APAREAMIENTO BLOQUEADO - Relación familiar directa detectada',
          `⚠️ ${familyRelationship.details}`,
          '📋 Buscar animales sin relación familiar para apareamiento'
        ],
        speciesSpecificAdvice: ['No recomendado debido a relación familiar'],
        optimalBreedingWindow: 'No aplicable',
        expectedGestationDays: 0,
        relationshipWarning: familyRelationship.details
      };
    }

    const species = male.species;
    const speciesConfig = SpeciesConfigService.getSpeciesConfig(species);
    
    if (!speciesConfig) {
      throw new Error(`Species configuration not found for: ${species}`);
    }

    // Extract lineage information
    const maleLineage = GeneticCalculatorService.extractLineage(male);
    const femaleLineage = GeneticCalculatorService.extractLineage(female);
    
    console.log(`${male.name} lineage depth: ${maleLineage.length}`);
    console.log(`${female.name} lineage depth: ${femaleLineage.length}`);
    
    // Find common ancestors
    const commonAncestors = GeneticCalculatorService.findCommonAncestors(maleLineage, femaleLineage);
    
    // Calculate inbreeding coefficient
    const inbreedingCoefficient = GeneticCalculatorService.calculateInbreedingCoefficient(commonAncestors, maleLineage, femaleLineage);
    
    // Determine risk level using species-specific thresholds
    const riskLevel = SpeciesConfigService.getInbreedingRiskLevel(species, inbreedingCoefficient);
    
    // Calculate genetic diversity with improved algorithm
    const geneticDiversityScore = GeneticCalculatorService.calculateImprovedGeneticDiversity(male, female, maleLineage, femaleLineage, commonAncestors);
    
    // Calculate compatibility score with enhanced algorithm
    const compatibilityScore = GeneticCalculatorService.calculateEnhancedCompatibilityScore(
      male, female, inbreedingCoefficient, geneticDiversityScore, maleLineage, femaleLineage, species
    );
    
    // Check for special breeds
    const maleBreedInfo = male.breed ? SpeciesConfigService.getSpecialBreedConfig(species, male.breed) : null;
    const femaleBreedInfo = female.breed ? SpeciesConfigService.getSpecialBreedConfig(species, female.breed) : null;
    const isSpecialBreed = !!(maleBreedInfo || femaleBreedInfo);

    // Generate recommendations
    const recommendations = RecommendationService.generateEnhancedRecommendations(
      male, female, riskLevel, geneticDiversityScore, commonAncestors, species, compatibilityScore
    );
    
    // Get species-specific advice
    const speciesSpecificAdvice = SpeciesConfigService.getOptimalBreedingAdvice(species, male.breed || female.breed);

    return {
      maleId: male.id,
      maleName: male.name,
      femaleId: female.id,
      femaleName: female.name,
      species,
      breedInfo: {
        maleBred: male.breed,
        femaleBred: female.breed,
        isSpecialBreed,
        specialBreedInfo: maleBreedInfo || femaleBreedInfo
      },
      compatibilityScore,
      inbreedingCoefficient,
      riskLevel,
      commonAncestors,
      geneticDiversityScore,
      recommendations,
      speciesSpecificAdvice,
      optimalBreedingWindow: speciesConfig.optimalBreedingMonths.join(', '),
      expectedGestationDays: speciesConfig.gestationDays
    };
  }

  static async generateUniversalBreedingRecommendations(): Promise<UniversalBreedingRecommendation[]> {
    console.log('💡 Generating universal breeding recommendations for all species...');
    
    try {
      const { males, females } = await this.getBreedingPairsBySpecies();
      
      if (males.length === 0 || females.length === 0) {
        console.log('No valid breeding pairs found - insufficient males or females');
        return [];
      }

      const recommendations: UniversalBreedingRecommendation[] = [];

      // Group by species for better organization
      const speciesGroups = new Set([...males.map(m => m.species), ...females.map(f => f.species)]);

      for (const species of speciesGroups) {
        const speciesMales = males.filter(m => m.species === species);
        const speciesFemales = females.filter(f => f.species === species);

        console.log(`Processing species ${species}: ${speciesMales.length} males, ${speciesFemales.length} females`);

        // Only analyze valid male x female combinations
        for (const male of speciesMales) {
          for (const female of speciesFemales) {
            try {
              const analysis = await this.analyzeUniversalPair(male, female);
              
              // Only include recommendations with acceptable compatibility scores and exclude deceased animals
              if (analysis.compatibilityScore >= 30 && 
                  !analysis.relationshipWarning && 
                  male.lifecycleStatus !== 'deceased' && 
                  female.lifecycleStatus !== 'deceased') {
                const speciesConfig = SpeciesConfigService.getSpeciesConfig(species);
                
                const expectedOffspringBreed = SpeciesConfigService.calculateOffspringBreed(male.breed, female.breed);
                
                const recommendation: UniversalBreedingRecommendation = {
                  pairId: `${male.id}-${female.id}`,
                  maleName: male.name,
                  femaleName: female.name,
                  species,
                  breed: expectedOffspringBreed, // Expected offspring breed
                  parentBreeds: {
                    male: male.breed,
                    female: female.breed
                  },
                  compatibilityScore: analysis.compatibilityScore,
                  breedingWindow: analysis.optimalBreedingWindow,
                  seasonalAdvice: analysis.speciesSpecificAdvice.slice(0, 3),
                  geneticBenefits: [
                    `Diversidad genética: ${analysis.geneticDiversityScore.toFixed(1)}%`,
                    `Preservación del linaje de ${speciesConfig?.name || species}`,
                    analysis.riskLevel === 'low' ? 'Bajo riesgo genético' : 'Monitoreo genético recomendado'
                  ],
                  considerations: analysis.recommendations.slice(0, 3),
                  isSpecialBreed: analysis.breedInfo?.isSpecialBreed || false,
                  gestationDays: analysis.expectedGestationDays
                };

                recommendations.push(recommendation);
              } else if (analysis.relationshipWarning) {
                console.log(`Blocked recommendation due to family relationship: ${male.name} x ${female.name} - ${analysis.relationshipWarning}`);
              } else {
                console.log(`Low compatibility recommendation filtered: ${male.name} x ${female.name} - ${analysis.compatibilityScore}%`);
              }
            } catch (error) {
              console.error(`Error analyzing pair ${male.name} (${male.gender}) x ${female.name} (${female.gender}):`, error);
            }
          }
        }
      }

      console.log(`Generated ${recommendations.length} valid breeding recommendations`);
      return recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    } catch (error) {
      console.error('Error generating universal breeding recommendations:', error);
      return [];
    }
  }
}

// Re-export types for backward compatibility
export type { UniversalPedigreeAnalysis, UniversalBreedingRecommendation, FamilyRelationship } from './types';
