import { supabase } from '@/integrations/supabase/client';

export interface SimpleBreedingRecommendation {
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

export class SimpleBreedingRecommendations {
  static async generateRecommendations(): Promise<SimpleBreedingRecommendation[]> {
    console.log('🔥 SIMPLE: Starting breeding recommendations generation...');
    
    try {
      // Simple query - just get basic animal info
      const { data: animals, error } = await supabase
        .from('animals')
        .select('id, name, species, gender, health_status, mother_id, father_id')
        .eq('lifecycle_status', 'active')
        .not('gender', 'is', null)
        .limit(50);

      console.log('🔥 SIMPLE: Raw animals from DB:', animals?.length || 0);

      if (error) {
        console.error('🔥 SIMPLE: Database error:', error);
        return [];
      }

      if (!animals || animals.length < 2) {
        console.log('🔥 SIMPLE: Not enough animals for breeding');
        return [];
      }

      // Filter males and females
      const males = animals.filter(a => {
        const gender = a.gender?.toLowerCase();
        return gender === 'male' || gender === 'macho' || gender === 'm';
      });

      const females = animals.filter(a => {
        const gender = a.gender?.toLowerCase();
        return gender === 'female' || gender === 'hembra' || gender === 'f';
      });

      console.log('🔥 SIMPLE: Males:', males.length, 'Females:', females.length);

      if (males.length === 0 || females.length === 0) {
        console.log('🔥 SIMPLE: Missing gender groups');
        return [];
      }

      const recommendations: SimpleBreedingRecommendation[] = [];

      // Generate simple recommendations
      for (let i = 0; i < Math.min(males.length, 3); i++) {
        for (let j = 0; j < Math.min(females.length, 3); j++) {
          const male = males[i];
          const female = females[j];

          // Skip if same animal
          if (male.id === female.id) continue;

          // Simple incest check
          let inbreedingRisk: 'low' | 'moderate' | 'high' = 'low';
          let blocked = false;

          // Check if one is parent of the other
          if (male.id === female.mother_id || male.id === female.father_id ||
              female.id === male.mother_id || female.id === male.father_id) {
            console.log(`🔥 SIMPLE: BLOCKED parent-child: ${male.name} x ${female.name}`);
            blocked = true;
          }

          // Check if siblings
          if (male.mother_id && female.mother_id && male.mother_id === female.mother_id) {
            console.log(`🔥 SIMPLE: BLOCKED siblings (same mother): ${male.name} x ${female.name}`);
            blocked = true;
          }

          if (male.father_id && female.father_id && male.father_id === female.father_id) {
            console.log(`🔥 SIMPLE: BLOCKED siblings (same father): ${male.name} x ${female.name}`);
            blocked = true;
          }

          // Skip blocked pairings
          if (blocked) continue;

          // Simple compatibility score
          let score = 50;
          if (male.health_status === 'healthy' && female.health_status === 'healthy') {
            score += 30;
          }
          if (male.species === female.species) {
            score += 20;
          }

          const recommendation: SimpleBreedingRecommendation = {
            id: `${male.id}-${female.id}`,
            maleId: male.id,
            maleName: male.name,
            femaleId: female.id,
            femaleName: female.name,
            compatibilityScore: score,
            geneticDiversityGain: Math.round(score * 0.8),
            inbreedingRisk,
            recommendations: [
              '✅ Apareamiento recomendado',
              `🧬 Compatibilidad: ${score}%`,
              `🐑 Especies: ${male.species}`
            ],
            reasoning: [
              `Macho: ${male.name}`,
              `Hembra: ${female.name}`,
              'Análisis básico completado'
            ]
          };

          recommendations.push(recommendation);
        }
      }

      console.log('🔥 SIMPLE: Generated', recommendations.length, 'recommendations');
      return recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    } catch (error) {
      console.error('🔥 SIMPLE: Error generating recommendations:', error);
      return [];
    }
  }
}