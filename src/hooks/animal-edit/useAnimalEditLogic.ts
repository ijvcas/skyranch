
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAnimal, updateAnimal } from '@/services/animalService';
import { checkPermission } from '@/services/permissionService';
import { useAnimalNames } from '@/hooks/useAnimalNames';
import { format } from 'date-fns';

export const useAnimalEditLogic = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    gender: '',
    tag: '',
    birthDate: '',
    weight: '',
    color: '',
    healthStatus: 'healthy',
    notes: '',
    image: null as string | null,
    lifecycleStatus: 'active',
    dateOfDeath: '',
    causeOfDeath: '',
    // Pedigree data
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
    paternalGreatGrandfatherPaternalId: ''
  });

  const { getNameOnly, getDisplayName, animalNamesMap } = useAnimalNames();

  const { data: animal, isLoading, error } = useQuery({
    queryKey: ['animal', id],
    queryFn: () => getAnimal(id!),
    enabled: !!id
  });

  useEffect(() => {
    if (animal) {
      // Compute friendly display for parents if they are registered UUIDs
      const motherDisplay = getNameOnly(animal.motherId) || animal.motherId || '';
      const fatherDisplay = getNameOnly(animal.fatherId) || animal.fatherId || '';

      // Derive a human-friendly note if it came from a breeding record
      const rawNotes = animal.notes || '';
      let derivedNotes = rawNotes;
      if (rawNotes.toLowerCase().includes('registro de apareamiento')) {
        const motherName = getDisplayName(animal.motherId) || motherDisplay || 'madre desconocida';
        let dateStr = '';
        if (animal.birthDate) {
          try {
            dateStr = format(new Date(animal.birthDate), 'dd/MM/yyyy');
          } catch {
            dateStr = String(animal.birthDate);
          }
        }
        derivedNotes = `Creado automáticamente desde parto de ${motherName}${dateStr ? ' el ' + dateStr : ''}`;
      }

      const newFormData = {
        name: animal.name || '',
        species: animal.species || '',
        breed: animal.breed || '',
        gender: animal.gender || '',
        tag: animal.tag || '',
        birthDate: animal.birthDate || '',
        weight: animal.weight?.toString() || '',
        color: animal.color || '',
        healthStatus: animal.healthStatus || 'healthy',
        notes: derivedNotes,
        image: animal.image || null,
        lifecycleStatus: animal.lifecycleStatus || 'active',
        dateOfDeath: animal.dateOfDeath || '',
        causeOfDeath: animal.causeOfDeath || '',
        motherId: animal.motherId || '',
        fatherId: animal.fatherId || '',
        maternalGrandmotherId: animal.maternalGrandmotherId || '',
        maternalGrandfatherId: animal.maternalGrandfatherId || '',
        paternalGrandmotherId: animal.paternalGrandmotherId || '',
        paternalGrandfatherId: animal.paternalGrandfatherId || '',
        maternalGreatGrandmotherMaternalId: animal.maternalGreatGrandmotherMaternalId || '',
        maternalGreatGrandfatherMaternalId: animal.maternalGreatGrandfatherMaternalId || '',
        maternalGreatGrandmotherPaternalId: animal.maternalGreatGrandmotherPaternalId || '',
        maternalGreatGrandfatherPaternalId: animal.maternalGreatGrandfatherPaternalId || '',
        paternalGreatGrandmotherMaternalId: animal.paternalGreatGrandmotherMaternalId || '',
        paternalGreatGrandfatherMaternalId: animal.paternalGreatGrandfatherMaternalId || '',
        paternalGreatGrandmotherPaternalId: animal.paternalGreatGrandmotherPaternalId || '',
        paternalGreatGrandfatherPaternalId: animal.paternalGreatGrandfatherPaternalId || ''
      };
      
      console.log('🔄 Initial formData set with lifecycleStatus:', newFormData.lifecycleStatus);
      console.log('🔄 Animal lifecycleStatus from DB:', animal.lifecycleStatus);
      
      setFormData(newFormData);
    }
  }, [animal, getNameOnly, getDisplayName, animalNamesMap]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🔍 Checking animals_edit permission...');
      await checkPermission('animals_edit');
      console.log('✅ Permission granted for animal edit');
      
      return updateAnimal(id!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal', id] });
      toast({
        title: "Animal Actualizado",
        description: `${formData.name} ha sido actualizado exitosamente.`,
      });
      navigate(`/animals/${id}`);
    },
    onError: (error: any) => {
      console.error('❌ Error updating animal:', error);
      
      if (error.message?.includes('Acceso denegado')) {
        setPermissionError(error.message);
        toast({
          title: "Sin Permisos",
          description: "No tienes permisos para editar animales.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el animal.",
          variant: "destructive"
        });
      }
    }
  });

  const handleInputChange = (field: string, value: string) => {
    console.log('🔄 handleInputChange called:', field, '=', value);
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };
      console.log('🔄 FormData updated:', newFormData);
      return newFormData;
    });
  };

  const handleImageChange = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image: imageUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPermissionError(null);
    
    if (!formData.name || !formData.species || !formData.tag) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa nombre, especie y etiqueta.",
        variant: "destructive"
      });
      return;
    }

    console.log('🔄 Submitting animal edit form:', formData);
    updateMutation.mutate(formData);
  };

  return {
    id,
    animal,
    isLoading,
    error,
    formData,
    permissionError,
    updateMutation,
    handleInputChange,
    handleImageChange,
    handleSubmit,
    navigate
  };
};
