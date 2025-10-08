import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Animal {
  id: string;
  name: string;
  tag: string;
  species: string;
  breed?: string;
  gender?: string;
  birth_date?: string;
  father_id?: string;
  mother_id?: string;
  paternal_grandfather_id?: string;
  paternal_grandmother_id?: string;
  maternal_grandfather_id?: string;
  maternal_grandmother_id?: string;
  paternal_great_grandfather_paternal_id?: string;
  paternal_great_grandmother_paternal_id?: string;
  paternal_great_grandfather_maternal_id?: string;
  paternal_great_grandmother_maternal_id?: string;
  maternal_great_grandfather_paternal_id?: string;
  maternal_great_grandmother_paternal_id?: string;
  maternal_great_grandfather_maternal_id?: string;
  maternal_great_grandmother_maternal_id?: string;
}

interface CommonAncestor {
  name: string;
  generations: number;
  relationshipPath: string;
}

interface PairingRecommendation {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧬 Analyze Inbreeding function called');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { pedigreeData, userId } = await req.json();
    
    if (!pedigreeData) {
      throw new Error('No pedigree data provided');
    }

    console.log('📊 Analyzing inbreeding for:', pedigreeData.animalName);

    // Query all active animals with complete pedigree data
    const { data: animals, error: animalsError } = await supabase
      .from('animals')
      .select(`
        id, name, tag, species, breed, gender, birth_date,
        father_id, mother_id,
        paternal_grandfather_id, paternal_grandmother_id,
        maternal_grandfather_id, maternal_grandmother_id,
        paternal_great_grandfather_paternal_id, paternal_great_grandmother_paternal_id,
        paternal_great_grandfather_maternal_id, paternal_great_grandmother_maternal_id,
        maternal_great_grandfather_paternal_id, maternal_great_grandmother_paternal_id,
        maternal_great_grandfather_maternal_id, maternal_great_grandmother_maternal_id
      `)
      .eq('user_id', userId || user.id)
      .eq('lifecycle_status', 'active');

    if (animalsError) {
      console.error('❌ Error fetching animals:', animalsError);
      throw animalsError;
    }

    console.log(`📦 Found ${animals?.length || 0} animals in database`);

    // Build ancestor tree for external animal
    const externalAncestors = buildAncestorTree(pedigreeData);
    console.log(`🌳 External animal has ${externalAncestors.size} ancestors`);

    // Analyze each animal for inbreeding
    const compatiblePairings: PairingRecommendation[] = [];
    const cautiousPairings: PairingRecommendation[] = [];
    const avoidPairings: PairingRecommendation[] = [];

    for (const animal of (animals || [])) {
      const farmAncestors = buildAnimalAncestorTree(animal);
      const { coefficient, commonAncestors } = calculateKinshipCoefficient(externalAncestors, farmAncestors);
      
      const inbreedingPercentage = coefficient * 100;
      
      let riskLevel: 'low' | 'moderate' | 'high';
      let recommendation: string;
      let purchaseAdvice: 'recommended' | 'consider_carefully' | 'not_recommended';
      
      if (inbreedingPercentage < 3) {
        riskLevel = 'low';
        recommendation = 'Emparejamiento seguro con bajo riesgo de consanguinidad';
        purchaseAdvice = 'recommended';
        
        compatiblePairings.push({
          animalId: animal.id,
          animalName: animal.name,
          animalTag: animal.tag,
          animalBreed: animal.breed || 'Sin especificar',
          animalGender: animal.gender || 'Sin especificar',
          inbreedingCoefficient: coefficient,
          inbreedingPercentage,
          riskLevel,
          commonAncestors,
          recommendation,
          detailedPath: generateRelationshipPath(commonAncestors),
          purchaseAdvice
        });
      } else if (inbreedingPercentage < 8) {
        riskLevel = 'moderate';
        recommendation = 'Emparejamiento aceptable con monitoreo veterinario recomendado';
        purchaseAdvice = 'consider_carefully';
        
        cautiousPairings.push({
          animalId: animal.id,
          animalName: animal.name,
          animalTag: animal.tag,
          animalBreed: animal.breed || 'Sin especificar',
          animalGender: animal.gender || 'Sin especificar',
          inbreedingCoefficient: coefficient,
          inbreedingPercentage,
          riskLevel,
          commonAncestors,
          recommendation,
          detailedPath: generateRelationshipPath(commonAncestors),
          purchaseAdvice
        });
      } else {
        riskLevel = 'high';
        recommendation = 'Alto riesgo de consanguinidad - NO recomendado';
        purchaseAdvice = 'not_recommended';
        
        avoidPairings.push({
          animalId: animal.id,
          animalName: animal.name,
          animalTag: animal.tag,
          animalBreed: animal.breed || 'Sin especificar',
          animalGender: animal.gender || 'Sin especificar',
          inbreedingCoefficient: coefficient,
          inbreedingPercentage,
          riskLevel,
          commonAncestors,
          recommendation,
          detailedPath: generateRelationshipPath(commonAncestors),
          purchaseAdvice
        });
      }
    }

    // Sort by inbreeding percentage (lowest first)
    compatiblePairings.sort((a, b) => a.inbreedingPercentage - b.inbreedingPercentage);
    cautiousPairings.sort((a, b) => a.inbreedingPercentage - b.inbreedingPercentage);
    avoidPairings.sort((a, b) => b.inbreedingPercentage - a.inbreedingPercentage);

    console.log(`✅ Analysis complete: ${compatiblePairings.length} compatible, ${cautiousPairings.length} cautious, ${avoidPairings.length} avoid`);

    return new Response(JSON.stringify({
      success: true,
      externalAnimal: {
        name: pedigreeData.animalName,
        breed: pedigreeData.breed,
        gender: pedigreeData.gender,
        birthDate: pedigreeData.birthDate
      },
      compatiblePairings,
      cautiousPairings,
      avoidPairings,
      totalAnimalsAnalyzed: animals?.length || 0,
      analysisDate: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in analyze-inbreeding:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Error analyzing inbreeding',
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Build ancestor tree from pedigree data (5 generations)
function buildAncestorTree(pedigreeData: any): Map<string, number> {
  const ancestors = new Map<string, number>();
  
  // Generation 1: Parents
  addAncestor(ancestors, pedigreeData.father?.name, 1);
  addAncestor(ancestors, pedigreeData.mother?.name, 1);
  
  // Generation 2: Grandparents
  addAncestor(ancestors, pedigreeData.paternalGrandfather, 2);
  addAncestor(ancestors, pedigreeData.paternalGrandmother, 2);
  addAncestor(ancestors, pedigreeData.maternalGrandfather, 2);
  addAncestor(ancestors, pedigreeData.maternalGrandmother, 2);
  
  // Generation 3: Great-grandparents (8 animals)
  if (pedigreeData.paternalGreatGrandparents) {
    pedigreeData.paternalGreatGrandparents.forEach((name: string) => addAncestor(ancestors, name, 3));
  }
  if (pedigreeData.maternalGreatGrandparents) {
    pedigreeData.maternalGreatGrandparents.forEach((name: string) => addAncestor(ancestors, name, 3));
  }
  
  // Generation 4: Great-great-grandparents (16 animals)
  if (pedigreeData.generation4) {
    if (pedigreeData.generation4.paternalLine) {
      pedigreeData.generation4.paternalLine.forEach((name: string) => addAncestor(ancestors, name, 4));
    }
    if (pedigreeData.generation4.maternalLine) {
      pedigreeData.generation4.maternalLine.forEach((name: string) => addAncestor(ancestors, name, 4));
    }
  }
  
  // Generation 5: Great-great-great-grandparents (32 animals)
  if (pedigreeData.generation5) {
    if (pedigreeData.generation5.paternalLine) {
      pedigreeData.generation5.paternalLine.forEach((name: string) => addAncestor(ancestors, name, 5));
    }
    if (pedigreeData.generation5.maternalLine) {
      pedigreeData.generation5.maternalLine.forEach((name: string) => addAncestor(ancestors, name, 5));
    }
  }
  
  return ancestors;
}

// Build ancestor tree from database animal (5 generations)
function buildAnimalAncestorTree(animal: Animal): Map<string, number> {
  const ancestors = new Map<string, number>();
  
  // Generation 1: Parents
  addAncestor(ancestors, animal.father_id, 1);
  addAncestor(ancestors, animal.mother_id, 1);
  
  // Generation 2: Grandparents
  addAncestor(ancestors, animal.paternal_grandfather_id, 2);
  addAncestor(ancestors, animal.paternal_grandmother_id, 2);
  addAncestor(ancestors, animal.maternal_grandfather_id, 2);
  addAncestor(ancestors, animal.maternal_grandmother_id, 2);
  
  // Generation 3: Great-grandparents
  addAncestor(ancestors, animal.paternal_great_grandfather_paternal_id, 3);
  addAncestor(ancestors, animal.paternal_great_grandmother_paternal_id, 3);
  addAncestor(ancestors, animal.paternal_great_grandfather_maternal_id, 3);
  addAncestor(ancestors, animal.paternal_great_grandmother_maternal_id, 3);
  addAncestor(ancestors, animal.maternal_great_grandfather_paternal_id, 3);
  addAncestor(ancestors, animal.maternal_great_grandmother_paternal_id, 3);
  addAncestor(ancestors, animal.maternal_great_grandfather_maternal_id, 3);
  addAncestor(ancestors, animal.maternal_great_grandmother_maternal_id, 3);
  
  return ancestors;
}

function addAncestor(ancestors: Map<string, number>, name: string | null | undefined, generation: number) {
  if (!name) return;
  const normalized = normalizeName(name);
  if (normalized) {
    // Keep the minimum generation (closest to subject)
    if (!ancestors.has(normalized) || ancestors.get(normalized)! > generation) {
      ancestors.set(normalized, generation);
    }
  }
}

function normalizeName(name: string | null | undefined): string {
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

// Calculate Wright's kinship coefficient
function calculateKinshipCoefficient(
  ancestors1: Map<string, number>,
  ancestors2: Map<string, number>
): { coefficient: number; commonAncestors: CommonAncestor[] } {
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
        relationshipPath: `${gen1 === 1 ? 'Padre/Madre' : gen1 === 2 ? 'Abuelo/a' : `Gen ${gen1}`} - ${gen2 === 1 ? 'Padre/Madre' : gen2 === 2 ? 'Abuelo/a' : `Gen ${gen2}`}`
      });
    }
  }
  
  return { coefficient: totalCoefficient, commonAncestors };
}

function generateRelationshipPath(commonAncestors: CommonAncestor[]): string {
  if (commonAncestors.length === 0) return 'Sin ancestros comunes';
  
  return commonAncestors
    .map(a => `${a.name} (${a.relationshipPath})`)
    .join(', ');
}
