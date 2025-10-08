
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
  maternalGrandmotherId: string;
  maternalGrandfatherId: string;
  paternalGrandmotherId: string;
  paternalGrandfatherId: string;
  maternalGreatGrandmotherMaternalId: string;
  maternalGreatGrandfatherMaternalId: string;
  maternalGreatGrandmotherPaternalId: string;
  maternalGreatGrandfatherPaternalId: string;
  paternalGreatGrandmotherMaternalId: string;
  paternalGreatGrandfatherMaternalId: string;
  paternalGreatGrandmotherPaternalId: string;
  paternalGreatGrandfatherPaternalId: string;
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
    maternalGrandmotherId: '',
    maternalGrandfatherId: '',
    paternalGrandmotherId: '',
    paternalGrandfatherId: '',
    maternalGreatGrandmotherMaternalId: '',
    maternalGreatGrandfatherMaternalId: '',
    maternalGreatGrandmotherPaternalId: '',
    maternalGreatGrandfatherPaternalId: '',
    paternalGreatGrandmotherMaternalId: '',
    paternalGreatGrandfatherMaternalId: '',
    paternalGreatGrandmotherPaternalId: '',
    paternalGreatGrandfatherPaternalId: '',
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
            maternalGrandmotherId: maternalGrandmotherDisplayName,
            maternalGrandfatherId: maternalGrandfatherDisplayName,
            paternalGrandmotherId: paternalGrandmotherDisplayName,
            paternalGrandfatherId: paternalGrandfatherDisplayName,
            maternalGreatGrandmotherMaternalId: maternalGreatGrandmotherMaternalDisplayName,
            maternalGreatGrandfatherMaternalId: maternalGreatGrandfatherMaternalDisplayName,
            maternalGreatGrandmotherPaternalId: maternalGreatGrandmotherPaternalDisplayName,
            maternalGreatGrandfatherPaternalId: maternalGreatGrandfatherPaternalDisplayName,
            paternalGreatGrandmotherMaternalId: paternalGreatGrandmotherMaternalDisplayName,
            paternalGreatGrandfatherMaternalId: paternalGreatGrandfatherMaternalDisplayName,
            paternalGreatGrandmotherPaternalId: paternalGreatGrandmotherPaternalDisplayName,
            paternalGreatGrandfatherPaternalId: paternalGreatGrandfatherPaternalDisplayName,
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
