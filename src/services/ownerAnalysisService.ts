import { supabase } from '@/integrations/supabase/client';
import { ParcelOwner } from './parcelOwnersService';

export interface OwnerSimilarity {
  owner: ParcelOwner;
  similarityScore: number;
  matchReasons: string[];
}

export interface OwnerAnalysisResult {
  targetOwner: ParcelOwner;
  similarOwners: OwnerSimilarity[];
  relatedParcels: string[];
  analysisConfidence: number;
}

const calculateSimilarityScore = (owner1: ParcelOwner, owner2: ParcelOwner): number => {
  let score = 0;
  const maxScore = 100;

  // Name similarity (using basic string comparison)
  const name1 = owner1.owner_name.toLowerCase().trim();
  const name2 = owner2.owner_name.toLowerCase().trim();
  
  if (name1 === name2) {
    score += 40; // Exact match
  } else if (name1.includes(name2) || name2.includes(name1)) {
    score += 25; // Partial match
  } else {
    // Check for common words
    const words1 = name1.split(/\s+/);
    const words2 = name2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word) && word.length > 2);
    score += Math.min(commonWords.length * 10, 20);
  }

  // Email similarity
  if (owner1.contact_email && owner2.contact_email) {
    if (owner1.contact_email.toLowerCase() === owner2.contact_email.toLowerCase()) {
      score += 30;
    } else {
      // Check if email domains match
      const domain1 = owner1.contact_email.split('@')[1];
      const domain2 = owner2.contact_email.split('@')[1];
      if (domain1 === domain2) {
        score += 15;
      }
    }
  }

  // Phone similarity
  if (owner1.contact_phone && owner2.contact_phone) {
    const phone1 = owner1.contact_phone.replace(/\D/g, '');
    const phone2 = owner2.contact_phone.replace(/\D/g, '');
    if (phone1 === phone2) {
      score += 20;
    } else if (phone1.length >= 7 && phone2.length >= 7) {
      // Check last 7 digits for local number similarity
      const lastDigits1 = phone1.slice(-7);
      const lastDigits2 = phone2.slice(-7);
      if (lastDigits1 === lastDigits2) {
        score += 10;
      }
    }
  }

  // Identification number similarity
  if (owner1.identification_number && owner2.identification_number) {
    if (owner1.identification_number === owner2.identification_number) {
      score += 25;
    }
  }

  return Math.min(score, maxScore);
};

const getMatchReasons = (owner1: ParcelOwner, owner2: ParcelOwner, score: number): string[] => {
  const reasons: string[] = [];

  const name1 = owner1.owner_name.toLowerCase().trim();
  const name2 = owner2.owner_name.toLowerCase().trim();

  if (name1 === name2) {
    reasons.push('Nombre exacto');
  } else if (name1.includes(name2) || name2.includes(name1)) {
    reasons.push('Nombre parcial');
  }

  if (owner1.contact_email && owner2.contact_email) {
    if (owner1.contact_email.toLowerCase() === owner2.contact_email.toLowerCase()) {
      reasons.push('Email idéntico');
    } else {
      const domain1 = owner1.contact_email.split('@')[1];
      const domain2 = owner2.contact_email.split('@')[1];
      if (domain1 === domain2) {
        reasons.push('Mismo dominio de email');
      }
    }
  }

  if (owner1.contact_phone && owner2.contact_phone) {
    const phone1 = owner1.contact_phone.replace(/\D/g, '');
    const phone2 = owner2.contact_phone.replace(/\D/g, '');
    if (phone1 === phone2) {
      reasons.push('Teléfono idéntico');
    }
  }

  if (owner1.identification_number && owner2.identification_number) {
    if (owner1.identification_number === owner2.identification_number) {
      reasons.push('Número de identificación idéntico');
    }
  }

  return reasons;
};

export const analyzeOwnerSimilarity = async (targetOwner: ParcelOwner): Promise<OwnerAnalysisResult> => {
  try {
    // Get all owners except the target owner
    const { data: allOwners, error } = await supabase
      .from('parcel_owners')
      .select('*')
      .neq('id', targetOwner.id);

    if (error) {
      console.error('Error fetching owners for analysis:', error);
      throw error;
    }

    const similarOwners: OwnerSimilarity[] = [];
    const relatedParcels = new Set<string>();

    // Calculate similarity scores
    for (const owner of allOwners || []) {
      const score = calculateSimilarityScore(targetOwner, owner);
      
      if (score >= 30) { // Minimum threshold for similarity
        const matchReasons = getMatchReasons(targetOwner, owner, score);
        similarOwners.push({
          owner,
          similarityScore: score,
          matchReasons
        });
        
        // Add related parcels
        relatedParcels.add(owner.parcel_id);
      }
    }

    // Sort by similarity score
    similarOwners.sort((a, b) => b.similarityScore - a.similarityScore);

    // Calculate analysis confidence
    const maxScore = similarOwners.length > 0 ? similarOwners[0].similarityScore : 0;
    const analysisConfidence = Math.min((maxScore / 80) * 100, 100);

    return {
      targetOwner,
      similarOwners: similarOwners.slice(0, 10), // Limit to top 10 matches
      relatedParcels: Array.from(relatedParcels),
      analysisConfidence
    };
  } catch (error) {
    console.error('Error in owner similarity analysis:', error);
    throw error;
  }
};

export const findPotentialDuplicates = async (): Promise<OwnerSimilarity[]> => {
  try {
    const { data: allOwners, error } = await supabase
      .from('parcel_owners')
      .select('*')
      .order('owner_name');

    if (error) {
      console.error('Error fetching owners for duplicate analysis:', error);
      throw error;
    }

    const duplicates: OwnerSimilarity[] = [];
    const processedIds = new Set<string>();

    for (let i = 0; i < (allOwners || []).length; i++) {
      const owner1 = allOwners![i];
      
      if (processedIds.has(owner1.id)) continue;

      for (let j = i + 1; j < allOwners!.length; j++) {
        const owner2 = allOwners![j];
        
        if (processedIds.has(owner2.id)) continue;

        const score = calculateSimilarityScore(owner1, owner2);
        
        if (score >= 50) { // Higher threshold for potential duplicates
          const matchReasons = getMatchReasons(owner1, owner2, score);
          duplicates.push({
            owner: owner2,
            similarityScore: score,
            matchReasons
          });
          
          processedIds.add(owner2.id);
        }
      }
      
      processedIds.add(owner1.id);
    }

    return duplicates.sort((a, b) => b.similarityScore - a.similarityScore);
  } catch (error) {
    console.error('Error finding potential duplicates:', error);
    throw error;
  }
};

export const getOwnerParcels = async (ownerId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('parcel_owners')
      .select(`
        parcel_id,
        ownership_percentage,
        cadastral_parcels (
          parcel_id,
          display_name,
          lot_number,
          status,
          area_hectares,
          total_cost
        )
      `)
      .eq('id', ownerId);

    if (error) {
      console.error('Error fetching owner parcels:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getOwnerParcels:', error);
    throw error;
  }
};