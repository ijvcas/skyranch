
export interface SpeciesConfig {
  id: string;
  name: string;
  gestationDays: number;
  optimalBreedingMonths: string[];
  breedingSeasonAdvice: string[];
  inbreedingThresholds: {
    low: number;
    moderate: number;
    high: number;
  };
  specialBreeds?: {
    [breedName: string]: SpecialBreedConfig;
  };
}

export interface SpecialBreedConfig {
  name: string;
  origin: string;
  characteristics: string[];
  lineagePreservation: string;
  specialConsiderations: string[];
  website?: string;
}

export const SPECIES_CONFIGS: Record<string, SpeciesConfig> = {
  equino: {
    id: 'equino',
    name: 'Equinos',
    gestationDays: 340,
    optimalBreedingMonths: ['marzo', 'abril', 'mayo'],
    breedingSeasonAdvice: [
      'Primavera es óptima para apareamientos',
      'Evitar pleno verano por el calor',
      'Planificar nacimientos para primavera siguiente'
    ],
    inbreedingThresholds: {
      low: 0.0625,
      moderate: 0.125,
      high: 0.25
    },
    specialBreeds: {
      'baudet de poitou': {
        name: 'Baudet de Poitou',
        origin: 'Francia',
        characteristics: [
          'Raza francesa histórica de burros',
          'Pelaje largo y ondulado característico',
          'Excelente para producción mular'
        ],
        lineagePreservation: 'Preservación del linaje francés histórico',
        specialConsiderations: [
          'Mantener pureza de la raza francesa',
          'Gestación de 12-14 meses típica',
          'Registro genealógico francés importante'
        ],
        website: 'https://www.racesmulassieresdupoitou.com/baudet-du-poitou/'
      }
    }
  },
  ovino: {
    id: 'ovino',
    name: 'Ovinos',
    gestationDays: 147,
    optimalBreedingMonths: ['abril', 'mayo', 'junio'],
    breedingSeasonAdvice: [
      'Apareamiento en primavera para partos otoñales',
      'Considerar estacionalidad reproductiva',
      'Sincronizar con disponibilidad de pastos'
    ],
    inbreedingThresholds: {
      low: 0.0625,
      moderate: 0.125,
      high: 0.25
    },
    specialBreeds: {
      'nez noir du valais': {
        name: 'Nez Noir du Valais',
        origin: 'Suiza/Francia',
        characteristics: [
          'Oveja de montaña alpina',
          'Cara y extremidades negras características',
          'Excelente adaptación a terrenos montañosos'
        ],
        lineagePreservation: 'Preservación del linaje suizo/francés alpino',
        specialConsiderations: [
          'Mantener características alpinas',
          'Gestación de 5 meses estándar',
          'Adaptación a clima montañoso'
        ],
        website: 'https://neznoirduvalais.com'
      }
    }
  },
  bovino: {
    id: 'bovino',
    name: 'Bovinos',
    gestationDays: 283,
    optimalBreedingMonths: ['mayo', 'junio', 'julio'],
    breedingSeasonAdvice: [
      'Apareamiento en primavera-verano',
      'Considerar disponibilidad de pastos',
      'Planificar partos según clima'
    ],
    inbreedingThresholds: {
      low: 0.0625,
      moderate: 0.125,
      high: 0.25
    }
  },
  caprino: {
    id: 'caprino',
    name: 'Caprinos',
    gestationDays: 150,
    optimalBreedingMonths: ['agosto', 'septiembre', 'octubre'],
    breedingSeasonAdvice: [
      'Apareamiento otoñal para partos primaverales',
      'Aprovechar estacionalidad natural',
      'Sincronizar con época de abundante alimento'
    ],
    inbreedingThresholds: {
      low: 0.0625,
      moderate: 0.125,
      high: 0.25
    }
  },
  porcino: {
    id: 'porcino',
    name: 'Porcinos',
    gestationDays: 114,
    optimalBreedingMonths: ['todo el año'],
    breedingSeasonAdvice: [
      'Reproducción continua posible',
      'Considerar instalaciones climatizadas',
      'Planificar según demanda del mercado'
    ],
    inbreedingThresholds: {
      low: 0.0625,
      moderate: 0.125,
      high: 0.25
    }
  }
};

export class SpeciesConfigService {
  static getSpeciesConfig(species: string): SpeciesConfig | null {
    const normalizedSpecies = species.toLowerCase().trim();
    return SPECIES_CONFIGS[normalizedSpecies] || null;
  }

  static getSpecialBreedConfig(species: string, breedName: string): SpecialBreedConfig | null {
    const speciesConfig = this.getSpeciesConfig(species);
    if (!speciesConfig?.specialBreeds) return null;
    
    const normalizedBreed = breedName.toLowerCase().trim();
    return speciesConfig.specialBreeds[normalizedBreed] || null;
  }

  static getAllSpecies(): SpeciesConfig[] {
    return Object.values(SPECIES_CONFIGS);
  }

  static getInbreedingRiskLevel(species: string, coefficient: number): 'low' | 'moderate' | 'high' {
    const config = this.getSpeciesConfig(species);
    if (!config) return 'moderate';

    if (coefficient >= config.inbreedingThresholds.high) return 'high';
    if (coefficient >= config.inbreedingThresholds.moderate) return 'moderate';
    return 'low';
  }

  static getOptimalBreedingAdvice(species: string, breedName?: string): string[] {
    const speciesConfig = this.getSpeciesConfig(species);
    if (!speciesConfig) return [];

    let advice = [...speciesConfig.breedingSeasonAdvice];
    
    if (breedName) {
      const breedConfig = this.getSpecialBreedConfig(species, breedName);
      if (breedConfig) {
        advice.push(...breedConfig.specialConsiderations);
      }
    }

    return advice;
  }

  static calculateOffspringBreed(maleBreed?: string, femaleBreed?: string): string {
    // Handle cases where breeds are not specified
    if (!maleBreed && !femaleBreed) {
      return 'Mestizo';
    }
    
    if (!maleBreed) return femaleBreed || 'Mestizo';
    if (!femaleBreed) return maleBreed || 'Mestizo';
    
    // Normalize breed names for comparison
    const normalizedMale = maleBreed.toLowerCase().trim();
    const normalizedFemale = femaleBreed.toLowerCase().trim();
    
    // Same breed - pure breeding
    if (normalizedMale === normalizedFemale) {
      return maleBreed;
    }
    
    // Cross-breeding cases
    return `Cruza de ${maleBreed} x ${femaleBreed}`;
  }

  static getSpeciesDisplayName(species: string): string {
    const config = this.getSpeciesConfig(species);
    return config?.name || species.charAt(0).toUpperCase() + species.slice(1);
  }
}
