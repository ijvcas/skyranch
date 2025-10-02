
import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { createBreedingRecord } from '@/services/breedingService';
import { getAnimalNamesMap } from '@/services/animal/animalQueries';
import { calculateExpectedDueDate } from '@/services/gestationService';

export interface BreedingFormData {
  species: string;
  motherId: string;
  fatherId: string;
  breedingDate: string;
  breedingMethod: 'natural' | 'artificial_insemination' | 'embryo_transfer';
  expectedDueDate: string;
  actualBirthDate: string;
  pregnancyConfirmed: boolean;
  pregnancyConfirmationDate: string;
  pregnancyMethod: 'visual' | 'ultrasound' | 'blood_test' | 'palpation' | '';
  offspringCount: number;
  breedingNotes: string;
  veterinarian: string;
  cost: string;
  status: 'planned' | 'failed' | 'birth_completed' | 'completed' | 'confirmed_pregnant' | 'not_pregnant';
}

export const useBreedingForm = (onSuccess: () => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<BreedingFormData>({
    species: '',
    motherId: '',
    fatherId: '',
    breedingDate: '',
    breedingMethod: 'natural' as const,
    expectedDueDate: '',
    actualBirthDate: '',
    pregnancyConfirmed: false,
    pregnancyConfirmationDate: '',
    pregnancyMethod: '' as const,
    offspringCount: 0,
    breedingNotes: '',
    veterinarian: '',
    cost: '',
    status: 'planned' as const
  });

  const [motherSpecies, setMotherSpecies] = useState<string>('');

  // OPTIMIZED: Only fetch animal names
  const { data: animalNames = {} } = useQuery({
    queryKey: ['animals', 'names-map'],
    queryFn: () => getAnimalNamesMap(false),
    staleTime: 10 * 60_000,
  });

  const animals = Object.entries(animalNames).map(([id, name]) => ({ id, name }));

  const createMutation = useMutation({
    mutationFn: createBreedingRecord,
    onSuccess: (recordId) => {
      queryClient.invalidateQueries({ queryKey: ['breeding-records'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] }); // Refresh animals list too
      
      // Enhanced success message based on whether offspring were created
      const hasOffspring = formData.actualBirthDate && formData.offspringCount > 0;
      
      toast({
        title: "Registro Creado",
        description: hasOffspring 
          ? `El registro de apareamiento ha sido creado exitosamente. Se han generado automáticamente ${formData.offspringCount} registro${formData.offspringCount > 1 ? 's' : ''} de animal${formData.offspringCount > 1 ? 'es' : ''} para las crías.`
          : "El registro de apareamiento ha sido creado exitosamente.",
      });
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating breeding record:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el registro de apareamiento.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // If species changed, reset mother and father selections
      if (field === 'species') {
        newData.motherId = '';
        newData.fatherId = '';
        
        // Auto-calculate expected due date if breeding date exists
        if (newData.breedingDate && value) {
          const calculatedDate = calculateExpectedDueDate(newData.breedingDate, value);
          if (calculatedDate) {
            newData.expectedDueDate = calculatedDate;
          }
        }
      }
      
      // If breeding date changed and species exists, auto-calculate expected due date
      if (field === 'breedingDate' && prev.species && value) {
        const calculatedDate = calculateExpectedDueDate(value, prev.species);
        if (calculatedDate) {
          newData.expectedDueDate = calculatedDate;
        }
      }
      
      // Automatic status management
      if (field === 'pregnancyConfirmed') {
        if (value === true) {
          newData.status = 'confirmed_pregnant';
        } else if (value === false && !newData.actualBirthDate) {
          newData.status = 'planned';
        }
      }
      
      if (field === 'actualBirthDate' && value) {
        newData.status = 'birth_completed';
      }
      
      return newData;
    });
  };

  const resetForm = () => {
    setFormData({
      species: '',
      motherId: '',
      fatherId: '',
      breedingDate: '',
      breedingMethod: 'natural' as const,
      expectedDueDate: '',
      actualBirthDate: '',
      pregnancyConfirmed: false,
      pregnancyConfirmationDate: '',
      pregnancyMethod: '' as const,
      offspringCount: 0,
      breedingNotes: '',
      veterinarian: '',
      cost: '',
      status: 'planned' as const
    });
    setMotherSpecies('');
  };

  const validateForm = (): boolean => {
    if (!formData.motherId || !formData.fatherId || !formData.breedingDate) {
      toast({
        title: "Error",
        description: "Por favor complete los campos requeridos (Madre, Padre, Fecha de Apareamiento).",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const debouncedSubmit = useCallback(() => {
    // Clear any existing timeout
    if (submissionTimeoutRef.current) {
      clearTimeout(submissionTimeoutRef.current);
    }

    // Prevent multiple submissions
    if (isSubmitting || createMutation.isPending) {
      console.log('⚠️ Submission already in progress, ignoring duplicate request');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    console.log('📝 Starting breeding record creation...');

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

    createMutation.mutate(submitData);
  }, [formData, isSubmitting, createMutation.isPending, validateForm, createMutation, toast]);

  const submitForm = useCallback(() => {
    // Debounce submission to prevent rapid clicks
    submissionTimeoutRef.current = setTimeout(() => {
      debouncedSubmit();
    }, 100);
  }, [debouncedSubmit]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
      }
    };
  }, []);

  return {
    formData,
    animals,
    motherSpecies,
    createMutation,
    isSubmitting: isSubmitting || createMutation.isPending,
    handleInputChange,
    submitForm,
    resetForm
  };
};
