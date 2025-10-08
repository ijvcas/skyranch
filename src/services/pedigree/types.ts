
export interface PedigreeNode {
  id: string;
  name: string;
  gender?: string;
  generation: number;
  isRegistered: boolean;
  children?: PedigreeNode[];
}

export interface InbreedingAnalysis {
  coefficient: number;
  riskLevel: 'low' | 'moderate' | 'high';
  commonAncestors: string[];
  recommendations: string[];
}

export interface GeneticDiversityScore {
  score: number; // 0-100
  completeness: number; // percentage of known lineage
  diversityFactors: {
    uniqueAncestors: number;
    generationDepth: number;
    bloodlineVariety: number;
  };
}

export interface BreedingRecommendation {
  id: string;
  maleId: string;
  maleName: string;
  femaleId: string;
  femaleName: string;
  compatibilityScore: number;
  geneticDiversityGain: number;
  inbreedingRisk: 'low' | 'moderate' | 'high';
  recommendations: string[];
  reasoning: string[];
}

// Extended types for 5-generation pedigree analysis
export interface ExtendedPedigreeData {
  animalName: string;
  gender?: string;
  breed?: string;
  species?: string;
  birthDate?: string;
  registrationNumber?: string;
  father?: { name: string; details?: any };
  mother?: { name: string; details?: any };
  paternalGrandfather?: string;
  paternalGrandmother?: string;
  maternalGrandfather?: string;
  maternalGrandmother?: string;
  paternalGreatGrandparents?: string[];
  maternalGreatGrandparents?: string[];
  generation4?: {
    paternalLine: string[];
    maternalLine: string[];
  };
  generation5?: {
    paternalLine: string[];
    maternalLine: string[];
  };
}

export interface CommonAncestor {
  name: string;
  generationLevel: number;
  relationshipPath: string;
}

export interface PairingRecommendation {
  animalId: string;
  animalName: string;
  animalTag: string;
  animalBreed: string;
  animalGender: string;
  inbreedingCoefficient: number;
  inbreedingPercentage: number;
  riskLevel: 'low' | 'moderate' | 'high';
  commonAncestors: CommonAncestor[];
  recommendation: string;
  detailedPath: string;
  purchaseAdvice: 'recommended' | 'consider_carefully' | 'not_recommended';
}

export interface KinshipAnalysis {
  externalAnimal: {
    name: string;
    breed: string;
    gender: string;
    birthDate: string;
  };
  compatiblePairings: PairingRecommendation[];
  cautiousPairings: PairingRecommendation[];
  avoidPairings: PairingRecommendation[];
  totalAnimalsAnalyzed: number;
  analysisDate: string;
}
