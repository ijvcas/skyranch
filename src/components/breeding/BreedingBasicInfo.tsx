
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AnimalSelection from './AnimalSelection';
import BreedingDetailsSelector from './BreedingDetailsSelector';
import SpeciesSelector from './SpeciesSelector';

// Use minimal animal type for better performance
type MinimalAnimal = {
  id: string;
  name: string;
  species: string;
  gender: string | null;
};

interface BreedingBasicInfoProps {
  formData: {
    motherId: string;
    fatherId: string;
    breedingDate: string;
    breedingMethod: 'natural' | 'artificial_insemination' | 'embryo_transfer';
    expectedDueDate: string;
    species?: string;
  };
  animals: MinimalAnimal[];
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
          expectedDueDate={formData.expectedDueDate}
          onDateChange={handleDateChange}
          onMethodChange={(value) => onInputChange('breedingMethod', value)}
        />
      </CardContent>
    </Card>
  );
};

export default BreedingBasicInfo;
