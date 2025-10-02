
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Animal } from '@/stores/animalStore';
import AnimalSelection from './AnimalSelection';
import BreedingDetailsSelector from './BreedingDetailsSelector';
import SpeciesSelector from './SpeciesSelector';

interface BreedingBasicInfoProps {
  formData: {
    motherId: string;
    fatherId: string;
    breedingDate: string;
    breedingMethod: 'natural' | 'artificial_insemination' | 'embryo_transfer';
    status: 'planned' | 'failed' | 'birth_completed' | 'completed' | 'confirmed_pregnant' | 'not_pregnant';
    species?: string;
  };
  animals: Animal[];
  onInputChange: (field: string, value: any) => void;
}

const BreedingBasicInfo: React.FC<BreedingBasicInfoProps> = ({
  formData,
  animals,
  onInputChange
}) => {
  const handleDateChange = (field: string, date: string) => {
    onInputChange(field, date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Apareamiento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SpeciesSelector
          animals={animals}
          selectedSpecies={formData.species || ''}
          onSpeciesChange={(value) => onInputChange('species', value)}
        />

        <AnimalSelection
          motherId={formData.motherId}
          fatherId={formData.fatherId}
          animals={animals}
          selectedSpecies={formData.species}
          onMotherChange={(value) => onInputChange('motherId', value)}
          onFatherChange={(value) => onInputChange('fatherId', value)}
        />

        <BreedingDetailsSelector
          breedingDate={formData.breedingDate}
          breedingMethod={formData.breedingMethod}
          status={formData.status}
          onDateChange={handleDateChange}
          onMethodChange={(value) => onInputChange('breedingMethod', value)}
          onStatusChange={(value) => onInputChange('status', value)}
        />
      </CardContent>
    </Card>
  );
};

export default BreedingBasicInfo;
