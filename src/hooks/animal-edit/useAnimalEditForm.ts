
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
  gen4PaternalGgggfP: string;
  gen4PaternalGgggmP: string;
  gen4PaternalGggmfP: string;
  gen4PaternalGggmmP: string;
  gen4PaternalGgfgfP: string;
  gen4PaternalGgfgmP: string;
  gen4PaternalGgmgfP: string;
  gen4PaternalGgmgmP: string;
  gen4MaternalGgggfM: string;
  gen4MaternalGgggmM: string;
  gen4MaternalGggmfM: string;
  gen4MaternalGggmmM: string;
  gen4MaternalGgfgfM: string;
  gen4MaternalGgfgmM: string;
  gen4MaternalGgmgfM: string;
  gen4MaternalGgmgmM: string;
  gen5Paternal1: string;
  gen5Paternal2: string;
  gen5Paternal3: string;
  gen5Paternal4: string;
  gen5Paternal5: string;
  gen5Paternal6: string;
  gen5Paternal7: string;
  gen5Paternal8: string;
  gen5Paternal9: string;
  gen5Paternal10: string;
  gen5Paternal11: string;
  gen5Paternal12: string;
  gen5Paternal13: string;
  gen5Paternal14: string;
  gen5Paternal15: string;
  gen5Paternal16: string;
  gen5Maternal1: string;
  gen5Maternal2: string;
  gen5Maternal3: string;
  gen5Maternal4: string;
  gen5Maternal5: string;
  gen5Maternal6: string;
  gen5Maternal7: string;
  gen5Maternal8: string;
  gen5Maternal9: string;
  gen5Maternal10: string;
  gen5Maternal11: string;
  gen5Maternal12: string;
  gen5Maternal13: string;
  gen5Maternal14: string;
  gen5Maternal15: string;
  gen5Maternal16: string;
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
    gen4PaternalGgggfP: '',
    gen4PaternalGgggmP: '',
    gen4PaternalGggmfP: '',
    gen4PaternalGggmmP: '',
    gen4PaternalGgfgfP: '',
    gen4PaternalGgfgmP: '',
    gen4PaternalGgmgfP: '',
    gen4PaternalGgmgmP: '',
    gen4MaternalGgggfM: '',
    gen4MaternalGgggmM: '',
    gen4MaternalGggmfM: '',
    gen4MaternalGggmmM: '',
    gen4MaternalGgfgfM: '',
    gen4MaternalGgfgmM: '',
    gen4MaternalGgmgfM: '',
    gen4MaternalGgmgmM: '',
    gen5Paternal1: '',
    gen5Paternal2: '',
    gen5Paternal3: '',
    gen5Paternal4: '',
    gen5Paternal5: '',
    gen5Paternal6: '',
    gen5Paternal7: '',
    gen5Paternal8: '',
    gen5Paternal9: '',
    gen5Paternal10: '',
    gen5Paternal11: '',
    gen5Paternal12: '',
    gen5Paternal13: '',
    gen5Paternal14: '',
    gen5Paternal15: '',
    gen5Paternal16: '',
    gen5Maternal1: '',
    gen5Maternal2: '',
    gen5Maternal3: '',
    gen5Maternal4: '',
    gen5Maternal5: '',
    gen5Maternal6: '',
    gen5Maternal7: '',
    gen5Maternal8: '',
    gen5Maternal9: '',
    gen5Maternal10: '',
    gen5Maternal11: '',
    gen5Maternal12: '',
    gen5Maternal13: '',
    gen5Maternal14: '',
    gen5Maternal15: '',
    gen5Maternal16: '',
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
            gen4PaternalGgggfP: (animal as any).gen4PaternalGgggfP || '',
            gen4PaternalGgggmP: (animal as any).gen4PaternalGgggmP || '',
            gen4PaternalGggmfP: (animal as any).gen4PaternalGggmfP || '',
            gen4PaternalGggmmP: (animal as any).gen4PaternalGggmmP || '',
            gen4PaternalGgfgfP: (animal as any).gen4PaternalGgfgfP || '',
            gen4PaternalGgfgmP: (animal as any).gen4PaternalGgfgmP || '',
            gen4PaternalGgmgfP: (animal as any).gen4PaternalGgmgfP || '',
            gen4PaternalGgmgmP: (animal as any).gen4PaternalGgmgmP || '',
            gen4MaternalGgggfM: (animal as any).gen4MaternalGgggfM || '',
            gen4MaternalGgggmM: (animal as any).gen4MaternalGgggmM || '',
            gen4MaternalGggmfM: (animal as any).gen4MaternalGggmfM || '',
            gen4MaternalGggmmM: (animal as any).gen4MaternalGggmmM || '',
            gen4MaternalGgfgfM: (animal as any).gen4MaternalGgfgfM || '',
            gen4MaternalGgfgmM: (animal as any).gen4MaternalGgfgmM || '',
            gen4MaternalGgmgfM: (animal as any).gen4MaternalGgmgfM || '',
            gen4MaternalGgmgmM: (animal as any).gen4MaternalGgmgmM || '',
            gen5Paternal1: (animal as any).gen5Paternal1 || '',
            gen5Paternal2: (animal as any).gen5Paternal2 || '',
            gen5Paternal3: (animal as any).gen5Paternal3 || '',
            gen5Paternal4: (animal as any).gen5Paternal4 || '',
            gen5Paternal5: (animal as any).gen5Paternal5 || '',
            gen5Paternal6: (animal as any).gen5Paternal6 || '',
            gen5Paternal7: (animal as any).gen5Paternal7 || '',
            gen5Paternal8: (animal as any).gen5Paternal8 || '',
            gen5Paternal9: (animal as any).gen5Paternal9 || '',
            gen5Paternal10: (animal as any).gen5Paternal10 || '',
            gen5Paternal11: (animal as any).gen5Paternal11 || '',
            gen5Paternal12: (animal as any).gen5Paternal12 || '',
            gen5Paternal13: (animal as any).gen5Paternal13 || '',
            gen5Paternal14: (animal as any).gen5Paternal14 || '',
            gen5Paternal15: (animal as any).gen5Paternal15 || '',
            gen5Paternal16: (animal as any).gen5Paternal16 || '',
            gen5Maternal1: (animal as any).gen5Maternal1 || '',
            gen5Maternal2: (animal as any).gen5Maternal2 || '',
            gen5Maternal3: (animal as any).gen5Maternal3 || '',
            gen5Maternal4: (animal as any).gen5Maternal4 || '',
            gen5Maternal5: (animal as any).gen5Maternal5 || '',
            gen5Maternal6: (animal as any).gen5Maternal6 || '',
            gen5Maternal7: (animal as any).gen5Maternal7 || '',
            gen5Maternal8: (animal as any).gen5Maternal8 || '',
            gen5Maternal9: (animal as any).gen5Maternal9 || '',
            gen5Maternal10: (animal as any).gen5Maternal10 || '',
            gen5Maternal11: (animal as any).gen5Maternal11 || '',
            gen5Maternal12: (animal as any).gen5Maternal12 || '',
            gen5Maternal13: (animal as any).gen5Maternal13 || '',
            gen5Maternal14: (animal as any).gen5Maternal14 || '',
            gen5Maternal15: (animal as any).gen5Maternal15 || '',
            gen5Maternal16: (animal as any).gen5Maternal16 || '',
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
