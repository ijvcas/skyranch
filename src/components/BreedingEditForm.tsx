
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { updateBreedingRecord, BreedingRecord } from '@/services/breedingService';
import { getAllAnimals } from '@/services/animalService';
import { calculateExpectedDueDate, getSpeciesDisplayName } from '@/services/gestationService';
import BreedingBasicInfo from '@/components/breeding/BreedingBasicInfo';
import BreedingPregnancyInfo from '@/components/breeding/BreedingPregnancyInfo';
import BreedingAdditionalInfo from '@/components/breeding/BreedingAdditionalInfo';
import BreedingEditDateSection from '@/components/breeding/BreedingEditDateSection';

interface BreedingEditFormProps {
  record: BreedingRecord;
  onSuccess: () => void;
}

const BreedingEditForm: React.FC<BreedingEditFormProps> = ({ record, onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    motherId: record.motherId,
    fatherId: record.fatherId,
    breedingDate: record.breedingDate,
    breedingMethod: record.breedingMethod,
    expectedDueDate: record.expectedDueDate || '',
    actualBirthDate: record.actualBirthDate || '',
    pregnancyConfirmed: record.pregnancyConfirmed,
    pregnancyConfirmationDate: record.pregnancyConfirmationDate || '',
    pregnancyMethod: (record.pregnancyMethod || '') as 'visual' | 'ultrasound' | 'blood_test' | 'palpation' | '',
    offspringCount: record.offspringCount,
    breedingNotes: record.breedingNotes || '',
    veterinarian: record.veterinarian || '',
    cost: record.cost ? record.cost.toString() : '',
    status: record.status as 'planned' | 'failed' | 'birth_completed' | 'completed' | 'confirmed_pregnant' | 'not_pregnant'
  });

  const [motherSpecies, setMotherSpecies] = useState<string>('');

  const { data: animals = [] } = useQuery({
    queryKey: ['animals'],
    queryFn: () => getAllAnimals(false)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateBreedingRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-records'] });
      toast({
        title: "Registro Actualizado",
        description: "El registro de apareamiento ha sido actualizado exitosamente.",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating breeding record:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el registro de apareamiento.",
        variant: "destructive"
      });
    }
  });

  // Update mother species when mother is selected
  useEffect(() => {
    if (formData.motherId) {
      const selectedMother = animals.find(animal => animal.id === formData.motherId);
      if (selectedMother?.species) {
        setMotherSpecies(selectedMother.species);
      }
    } else {
      setMotherSpecies('');
    }
  }, [formData.motherId, animals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.motherId || !formData.fatherId || !formData.breedingDate) {
      toast({
        title: "Error",
        description: "Por favor complete los campos requeridos (Madre, Padre, Fecha de Apareamiento).",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      motherId: formData.motherId,
      fatherId: formData.fatherId,
      breedingDate: formData.breedingDate,
      breedingMethod: formData.breedingMethod,
      expectedDueDate: formData.expectedDueDate || undefined,
      actualBirthDate: formData.actualBirthDate || undefined,
      pregnancyConfirmed: formData.pregnancyConfirmed,
      pregnancyConfirmationDate: formData.pregnancyConfirmationDate || undefined,
      pregnancyMethod: formData.pregnancyMethod || undefined,
      offspringCount: formData.offspringCount,
      breedingNotes: formData.breedingNotes || undefined,
      veterinarian: formData.veterinarian || undefined,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      status: formData.status
    };

    updateMutation.mutate({ id: record.id, data: submitData });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRecalculateDate = () => {
    if (formData.motherId && formData.breedingDate) {
      const selectedMother = animals.find(animal => animal.id === formData.motherId);
      if (selectedMother?.species) {
        const calculatedDate = calculateExpectedDueDate(formData.breedingDate, selectedMother.species);
        if (calculatedDate) {
          setFormData(prev => ({ ...prev, expectedDueDate: calculatedDate }));
          toast({
            title: "Fecha Recalculada",
            description: `Fecha esperada de parto actualizada basada en ${getSpeciesDisplayName(selectedMother.species)}`,
          });
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BreedingBasicInfo
        formData={formData}
        animals={animals}
        onInputChange={handleInputChange}
      />

      <BreedingEditDateSection
        formData={formData}
        animals={animals}
        onInputChange={handleInputChange}
        onRecalculateDate={handleRecalculateDate}
      />

      <BreedingPregnancyInfo
        formData={formData}
        motherSpecies={motherSpecies}
        onInputChange={handleInputChange}
      />

      <BreedingAdditionalInfo
        formData={formData}
        onInputChange={handleInputChange}
      />

      <div className="flex space-x-4">
        <Button
          type="submit"
          className="flex-1"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Actualizando...' : 'Actualizar Registro'}
        </Button>
      </div>
    </form>
  );
};

export default BreedingEditForm;
