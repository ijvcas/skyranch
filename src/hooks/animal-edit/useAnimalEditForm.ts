
import { useState, useEffect } from 'react';
import type { Animal } from '@/stores/animalStore';
import { getAnimalDisplayName } from '@/services/animal';

interface AnimalEditFormData {
  name: string;
  tag: string;
  species: string;
  breed: string;
  birthDate: string;
  gender: string;
  weight: string;
  color: string;
  motherId: string;
  fatherId: string;
  maternal_grandmother_id: string;
  maternal_grandfather_id: string;
  paternal_grandmother_id: string;
  paternal_grandfather_id: string;
  maternal_great_grandmother_maternal_id: string;
  maternal_great_grandfather_maternal_id: string;
  maternal_great_grandmother_paternal_id: string;
  maternal_great_grandfather_paternal_id: string;
  paternal_great_grandmother_maternal_id: string;
  paternal_great_grandfather_maternal_id: string;
  paternal_great_grandmother_paternal_id: string;
  paternal_great_grandfather_paternal_id: string;
  gen4_paternal_ggggf_p: string;
  gen4_paternal_ggggm_p: string;
  gen4_paternal_gggmf_p: string;
  gen4_paternal_gggmm_p: string;
  gen4_paternal_ggfgf_p: string;
  gen4_paternal_ggfgm_p: string;
  gen4_paternal_ggmgf_p: string;
  gen4_paternal_ggmgm_p: string;
  gen4_maternal_ggggf_m: string;
  gen4_maternal_ggggm_m: string;
  gen4_maternal_gggmf_m: string;
  gen4_maternal_gggmm_m: string;
  gen4_maternal_ggfgf_m: string;
  gen4_maternal_ggfgm_m: string;
  gen4_maternal_ggmgf_m: string;
  gen4_maternal_ggmgm_m: string;
  gen5_paternal_1: string;
  gen5_paternal_2: string;
  gen5_paternal_3: string;
  gen5_paternal_4: string;
  gen5_paternal_5: string;
  gen5_paternal_6: string;
  gen5_paternal_7: string;
  gen5_paternal_8: string;
  gen5_paternal_9: string;
  gen5_paternal_10: string;
  gen5_paternal_11: string;
  gen5_paternal_12: string;
  gen5_paternal_13: string;
  gen5_paternal_14: string;
  gen5_paternal_15: string;
  gen5_paternal_16: string;
  gen5_maternal_1: string;
  gen5_maternal_2: string;
  gen5_maternal_3: string;
  gen5_maternal_4: string;
  gen5_maternal_5: string;
  gen5_maternal_6: string;
  gen5_maternal_7: string;
  gen5_maternal_8: string;
  gen5_maternal_9: string;
  gen5_maternal_10: string;
  gen5_maternal_11: string;
  gen5_maternal_12: string;
  gen5_maternal_13: string;
  gen5_maternal_14: string;
  gen5_maternal_15: string;
  gen5_maternal_16: string;
  notes: string;
  healthStatus: string;
  image: string | null;
}

export const useAnimalEditForm = (animal: Animal | null) => {
  const [formData, setFormData] = useState<AnimalEditFormData>({
    name: '',
    tag: '',
    species: '',
    breed: '',
    birthDate: '',
    gender: '',
    weight: '',
    color: '',
    motherId: '',
    fatherId: '',
    maternal_grandmother_id: '',
    maternal_grandfather_id: '',
    paternal_grandmother_id: '',
    paternal_grandfather_id: '',
    maternal_great_grandmother_maternal_id: '',
    maternal_great_grandfather_maternal_id: '',
    maternal_great_grandmother_paternal_id: '',
    maternal_great_grandfather_paternal_id: '',
    paternal_great_grandmother_maternal_id: '',
    paternal_great_grandfather_maternal_id: '',
    paternal_great_grandmother_paternal_id: '',
    paternal_great_grandfather_paternal_id: '',
    gen4_paternal_ggggf_p: '',
    gen4_paternal_ggggm_p: '',
    gen4_paternal_gggmf_p: '',
    gen4_paternal_gggmm_p: '',
    gen4_paternal_ggfgf_p: '',
    gen4_paternal_ggfgm_p: '',
    gen4_paternal_ggmgf_p: '',
    gen4_paternal_ggmgm_p: '',
    gen4_maternal_ggggf_m: '',
    gen4_maternal_ggggm_m: '',
    gen4_maternal_gggmf_m: '',
    gen4_maternal_gggmm_m: '',
    gen4_maternal_ggfgf_m: '',
    gen4_maternal_ggfgm_m: '',
    gen4_maternal_ggmgf_m: '',
    gen4_maternal_ggmgm_m: '',
    gen5_paternal_1: '',
    gen5_paternal_2: '',
    gen5_paternal_3: '',
    gen5_paternal_4: '',
    gen5_paternal_5: '',
    gen5_paternal_6: '',
    gen5_paternal_7: '',
    gen5_paternal_8: '',
    gen5_paternal_9: '',
    gen5_paternal_10: '',
    gen5_paternal_11: '',
    gen5_paternal_12: '',
    gen5_paternal_13: '',
    gen5_paternal_14: '',
    gen5_paternal_15: '',
    gen5_paternal_16: '',
    gen5_maternal_1: '',
    gen5_maternal_2: '',
    gen5_maternal_3: '',
    gen5_maternal_4: '',
    gen5_maternal_5: '',
    gen5_maternal_6: '',
    gen5_maternal_7: '',
    gen5_maternal_8: '',
    gen5_maternal_9: '',
    gen5_maternal_10: '',
    gen5_maternal_11: '',
    gen5_maternal_12: '',
    gen5_maternal_13: '',
    gen5_maternal_14: '',
    gen5_maternal_15: '',
    gen5_maternal_16: '',
    notes: '',
    healthStatus: 'healthy',
    image: null
  });

  useEffect(() => {
    const loadAnimalData = async () => {
      if (animal) {
        console.log('🔍 Loading animal data for editing:', animal);
        
        // Helper function to safely load display names
        const loadDisplayName = async (parentId: string | null | undefined): Promise<string> => {
          if (!parentId || parentId.trim() === '') {
            return '';
          }
          try {
            const displayName = await getAnimalDisplayName(parentId);
            return displayName || '';
          } catch (error) {
            console.error('Error loading display name for', parentId, error);
            return '';
          }
        };

        // Load all parent and great-grandparent display names
        try {
          const [
            motherDisplayName,
            fatherDisplayName,
            maternalGrandmotherDisplayName,
            maternalGrandfatherDisplayName,
            paternalGrandmotherDisplayName,
            paternalGrandfatherDisplayName,
            maternalGreatGrandmotherMaternalDisplayName,
            maternalGreatGrandfatherMaternalDisplayName,
            maternalGreatGrandmotherPaternalDisplayName,
            maternalGreatGrandfatherPaternalDisplayName,
            paternalGreatGrandmotherMaternalDisplayName,
            paternalGreatGrandfatherMaternalDisplayName,
            paternalGreatGrandmotherPaternalDisplayName,
            paternalGreatGrandfatherPaternalDisplayName
          ] = await Promise.all([
            loadDisplayName(animal.motherId),
            loadDisplayName(animal.fatherId),
            loadDisplayName(animal.maternal_grandmother_id),
            loadDisplayName(animal.maternal_grandfather_id),
            loadDisplayName(animal.paternal_grandmother_id),
            loadDisplayName(animal.paternal_grandfather_id),
            loadDisplayName(animal.maternal_great_grandmother_maternal_id),
            loadDisplayName(animal.maternal_great_grandfather_maternal_id),
            loadDisplayName(animal.maternal_great_grandmother_paternal_id),
            loadDisplayName(animal.maternal_great_grandfather_paternal_id),
            loadDisplayName(animal.paternal_great_grandmother_maternal_id),
            loadDisplayName(animal.paternal_great_grandfather_maternal_id),
            loadDisplayName(animal.paternal_great_grandmother_paternal_id),
            loadDisplayName(animal.paternal_great_grandfather_paternal_id)
          ]);

          const newFormData = {
            name: animal.name || '',
            tag: animal.tag || '',
            species: animal.species || '',
            breed: animal.breed || '',
            birthDate: animal.birthDate || '',
            gender: animal.gender || '',
            weight: animal.weight?.toString() || '',
            color: animal.color || '',
            motherId: motherDisplayName,
            fatherId: fatherDisplayName,
            maternal_grandmother_id: maternalGrandmotherDisplayName,
            maternal_grandfather_id: maternalGrandfatherDisplayName,
            paternal_grandmother_id: paternalGrandmotherDisplayName,
            paternal_grandfather_id: paternalGrandfatherDisplayName,
            maternal_great_grandmother_maternal_id: maternalGreatGrandmotherMaternalDisplayName,
            maternal_great_grandfather_maternal_id: maternalGreatGrandfatherMaternalDisplayName,
            maternal_great_grandmother_paternal_id: maternalGreatGrandmotherPaternalDisplayName,
            maternal_great_grandfather_paternal_id: maternalGreatGrandfatherPaternalDisplayName,
            paternal_great_grandmother_maternal_id: paternalGreatGrandmotherMaternalDisplayName,
            paternal_great_grandfather_maternal_id: paternalGreatGrandfatherMaternalDisplayName,
            paternal_great_grandmother_paternal_id: paternalGreatGrandmotherPaternalDisplayName,
            paternal_great_grandfather_paternal_id: paternalGreatGrandfatherPaternalDisplayName,
            gen4_paternal_ggggf_p: (animal as any).gen4_paternal_ggggf_p || '',
            gen4_paternal_ggggm_p: (animal as any).gen4_paternal_ggggm_p || '',
            gen4_paternal_gggmf_p: (animal as any).gen4_paternal_gggmf_p || '',
            gen4_paternal_gggmm_p: (animal as any).gen4_paternal_gggmm_p || '',
            gen4_paternal_ggfgf_p: (animal as any).gen4_paternal_ggfgf_p || '',
            gen4_paternal_ggfgm_p: (animal as any).gen4_paternal_ggfgm_p || '',
            gen4_paternal_ggmgf_p: (animal as any).gen4_paternal_ggmgf_p || '',
            gen4_paternal_ggmgm_p: (animal as any).gen4_paternal_ggmgm_p || '',
            gen4_maternal_ggggf_m: (animal as any).gen4_maternal_ggggf_m || '',
            gen4_maternal_ggggm_m: (animal as any).gen4_maternal_ggggm_m || '',
            gen4_maternal_gggmf_m: (animal as any).gen4_maternal_gggmf_m || '',
            gen4_maternal_gggmm_m: (animal as any).gen4_maternal_gggmm_m || '',
            gen4_maternal_ggfgf_m: (animal as any).gen4_maternal_ggfgf_m || '',
            gen4_maternal_ggfgm_m: (animal as any).gen4_maternal_ggfgm_m || '',
            gen4_maternal_ggmgf_m: (animal as any).gen4_maternal_ggmgf_m || '',
            gen4_maternal_ggmgm_m: (animal as any).gen4_maternal_ggmgm_m || '',
            gen5_paternal_1: (animal as any).gen5_paternal_1 || '',
            gen5_paternal_2: (animal as any).gen5_paternal_2 || '',
            gen5_paternal_3: (animal as any).gen5_paternal_3 || '',
            gen5_paternal_4: (animal as any).gen5_paternal_4 || '',
            gen5_paternal_5: (animal as any).gen5_paternal_5 || '',
            gen5_paternal_6: (animal as any).gen5_paternal_6 || '',
            gen5_paternal_7: (animal as any).gen5_paternal_7 || '',
            gen5_paternal_8: (animal as any).gen5_paternal_8 || '',
            gen5_paternal_9: (animal as any).gen5_paternal_9 || '',
            gen5_paternal_10: (animal as any).gen5_paternal_10 || '',
            gen5_paternal_11: (animal as any).gen5_paternal_11 || '',
            gen5_paternal_12: (animal as any).gen5_paternal_12 || '',
            gen5_paternal_13: (animal as any).gen5_paternal_13 || '',
            gen5_paternal_14: (animal as any).gen5_paternal_14 || '',
            gen5_paternal_15: (animal as any).gen5_paternal_15 || '',
            gen5_paternal_16: (animal as any).gen5_paternal_16 || '',
            gen5_maternal_1: (animal as any).gen5_maternal_1 || '',
            gen5_maternal_2: (animal as any).gen5_maternal_2 || '',
            gen5_maternal_3: (animal as any).gen5_maternal_3 || '',
            gen5_maternal_4: (animal as any).gen5_maternal_4 || '',
            gen5_maternal_5: (animal as any).gen5_maternal_5 || '',
            gen5_maternal_6: (animal as any).gen5_maternal_6 || '',
            gen5_maternal_7: (animal as any).gen5_maternal_7 || '',
            gen5_maternal_8: (animal as any).gen5_maternal_8 || '',
            gen5_maternal_9: (animal as any).gen5_maternal_9 || '',
            gen5_maternal_10: (animal as any).gen5_maternal_10 || '',
            gen5_maternal_11: (animal as any).gen5_maternal_11 || '',
            gen5_maternal_12: (animal as any).gen5_maternal_12 || '',
            gen5_maternal_13: (animal as any).gen5_maternal_13 || '',
            gen5_maternal_14: (animal as any).gen5_maternal_14 || '',
            gen5_maternal_15: (animal as any).gen5_maternal_15 || '',
            gen5_maternal_16: (animal as any).gen5_maternal_16 || '',
            notes: animal.notes || '',
            healthStatus: animal.healthStatus || 'healthy',
            image: animal.image
          };

          console.log('🔍 Setting form data:', newFormData);
          setFormData(newFormData);
        } catch (error) {
          console.error('Error loading ancestor display names:', error);
        }
      }
    };

    loadAnimalData();
  }, [animal]);

  const handleInputChange = (field: string, value: string) => {
    console.log(`🔄 Updating field ${field} with value:`, value);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log('🔄 Updated form data:', updated);
      return updated;
    });
  };

  const handleImageChange = (imageUrl: string | null) => {
    setFormData(prev => ({ ...prev, image: imageUrl }));
  };

  return {
    formData,
    handleInputChange,
    handleImageChange
  };
};
