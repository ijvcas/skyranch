
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
    location: null as any,
    lifecycleStatus: 'active',
    dateOfDeath: '',
    causeOfDeath: '',
    // Pedigree data - Generation 1 (Parents)
    motherId: '',
    fatherId: '',
    // Generation 2 (Grandparents)
    maternal_grandmother_id: '',
    maternal_grandfather_id: '',
    paternal_grandmother_id: '',
    paternal_grandfather_id: '',
    // Generation 3 (Great-grandparents)
    maternal_great_grandmother_maternal_id: '',
    maternal_great_grandfather_maternal_id: '',
    maternal_great_grandmother_paternal_id: '',
    maternal_great_grandfather_paternal_id: '',
    paternal_great_grandmother_maternal_id: '',
    paternal_great_grandfather_maternal_id: '',
    paternal_great_grandmother_paternal_id: '',
    paternal_great_grandfather_paternal_id: '',
    // Generation 4 (Great-great-grandparents) - Maternal line
    gen4_maternal_ggggf_m: '',
    gen4_maternal_ggggm_m: '',
    gen4_maternal_gggmf_m: '',
    gen4_maternal_gggmm_m: '',
    gen4_maternal_ggfgf_m: '',
    gen4_maternal_ggfgm_m: '',
    gen4_maternal_ggmgf_m: '',
    gen4_maternal_ggmgm_m: '',
    // Generation 4 - Paternal line
    gen4_paternal_ggggf_p: '',
    gen4_paternal_ggggm_p: '',
    gen4_paternal_gggmf_p: '',
    gen4_paternal_gggmm_p: '',
    gen4_paternal_ggfgf_p: '',
    gen4_paternal_ggfgm_p: '',
    gen4_paternal_ggmgf_p: '',
    gen4_paternal_ggmgm_p: '',
    // Generation 5 - Maternal line (16 ancestors)
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
    // Generation 5 - Paternal line (16 ancestors)
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
    pedigree_max_generation: 5
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
        location: (animal as any).location || null,
        lifecycleStatus: animal.lifecycleStatus || 'active',
        dateOfDeath: animal.dateOfDeath || '',
        causeOfDeath: animal.causeOfDeath || '',
        motherId: animal.motherId || '',
        fatherId: animal.fatherId || '',
        maternal_grandmother_id: animal.maternal_grandmother_id || '',
        maternal_grandfather_id: animal.maternal_grandfather_id || '',
        paternal_grandmother_id: animal.paternal_grandmother_id || '',
        paternal_grandfather_id: animal.paternal_grandfather_id || '',
        maternal_great_grandmother_maternal_id: animal.maternal_great_grandmother_maternal_id || '',
        maternal_great_grandfather_maternal_id: animal.maternal_great_grandfather_maternal_id || '',
        maternal_great_grandmother_paternal_id: animal.maternal_great_grandmother_paternal_id || '',
        maternal_great_grandfather_paternal_id: animal.maternal_great_grandfather_paternal_id || '',
        paternal_great_grandmother_maternal_id: animal.paternal_great_grandmother_maternal_id || '',
        paternal_great_grandfather_maternal_id: animal.paternal_great_grandfather_maternal_id || '',
        paternal_great_grandmother_paternal_id: animal.paternal_great_grandmother_paternal_id || '',
        paternal_great_grandfather_paternal_id: animal.paternal_great_grandfather_paternal_id || '',
        // Generation 4 - Maternal line
        gen4_maternal_ggggf_m: (animal as any).gen4_maternal_ggggf_m || '',
        gen4_maternal_ggggm_m: (animal as any).gen4_maternal_ggggm_m || '',
        gen4_maternal_gggmf_m: (animal as any).gen4_maternal_gggmf_m || '',
        gen4_maternal_gggmm_m: (animal as any).gen4_maternal_gggmm_m || '',
        gen4_maternal_ggfgf_m: (animal as any).gen4_maternal_ggfgf_m || '',
        gen4_maternal_ggfgm_m: (animal as any).gen4_maternal_ggfgm_m || '',
        gen4_maternal_ggmgf_m: (animal as any).gen4_maternal_ggmgf_m || '',
        gen4_maternal_ggmgm_m: (animal as any).gen4_maternal_ggmgm_m || '',
        // Generation 4 - Paternal line
        gen4_paternal_ggggf_p: (animal as any).gen4_paternal_ggggf_p || '',
        gen4_paternal_ggggm_p: (animal as any).gen4_paternal_ggggm_p || '',
        gen4_paternal_gggmf_p: (animal as any).gen4_paternal_gggmf_p || '',
        gen4_paternal_gggmm_p: (animal as any).gen4_paternal_gggmm_p || '',
        gen4_paternal_ggfgf_p: (animal as any).gen4_paternal_ggfgf_p || '',
        gen4_paternal_ggfgm_p: (animal as any).gen4_paternal_ggfgm_p || '',
        gen4_paternal_ggmgf_p: (animal as any).gen4_paternal_ggmgf_p || '',
        gen4_paternal_ggmgm_p: (animal as any).gen4_paternal_ggmgm_p || '',
        // Generation 5 - Maternal line
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
        // Generation 5 - Paternal line
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
        pedigree_max_generation: Number(animal.pedigree_max_generation) || 5
      };
      
      console.log('🔄 Initial formData set with lifecycleStatus:', newFormData.lifecycleStatus);
      console.log('🔄 Animal lifecycleStatus from DB:', animal.lifecycleStatus);
      
      setFormData(newFormData);
    }
  }, [animal]);

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

  const handleLocationChange = (location: any) => {
    setFormData(prev => ({ ...prev, location }));
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
    handleLocationChange,
    handleSubmit,
    navigate
  };
};
