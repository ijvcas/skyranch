
export interface UniversalPedigreeAnalysis {
  maleId: string;
  maleName: string;
  femaleId: string;
  femaleName: string;
  species: string;
  breedInfo?: {
    maleBred?: string;
    femaleBred?: string;
    isSpecialBreed: boolean;
    specialBreedInfo?: any;
  };
  compatibilityScore: number;
  inbreedingCoefficient: number;
  riskLevel: 'low' | 'moderate' | 'high';
  commonAncestors: string[];
  geneticDiversityScore: number;
  recommendations: string[];
  speciesSpecificAdvice: string[];
  optimalBreedingWindow: string;
  expectedGestationDays: number;
  relationshipWarning?: string;
}

export interface UniversalBreedingRecommendation {
  pairId: string;
  maleName: string;
  femaleName: string;
  species: string;
  breed?: string; // Expected offspring breed
  parentBreeds?: {
    male?: string;
    female?: string;
  };
  compatibilityScore: number;
  breedingWindow: string;
  seasonalAdvice: string[];
  geneticBenefits: string[];
  considerations: string[];
  isSpecialBreed: boolean;
  gestationDays: number;
}

export interface FamilyRelationship {
  type: 'parent-child' | 'siblings' | 'grandparent-grandchild' | 'none';
  details: string;
  shouldBlock: boolean;
}
