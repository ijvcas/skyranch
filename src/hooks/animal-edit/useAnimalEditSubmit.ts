
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { updateAnimal } from '@/services/animal';

export const useAnimalEditSubmit = (id: string, formData: any, navigate: any) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateAnimal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal', id] });
      toast({
        title: "Animal Actualizado",
        description: `${formData.name} ha sido actualizado exitosamente.`,
      });
      navigate('/animals');
    },
    onError: (error) => {
      console.error('Error updating animal:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el animal.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    console.log('🔄 Form data being submitted:', formData);
    
    // Ensure we're sending all pedigree data correctly (all 5 generations)
    const submitData = {
      ...formData,
      motherId: formData.motherId || '',
      fatherId: formData.fatherId || '',
      maternal_grandmother_id: formData.maternal_grandmother_id || '',
      maternal_grandfather_id: formData.maternal_grandfather_id || '',
      paternal_grandmother_id: formData.paternal_grandmother_id || '',
      paternal_grandfather_id: formData.paternal_grandfather_id || '',
      maternal_great_grandmother_maternal_id: formData.maternal_great_grandmother_maternal_id || '',
      maternal_great_grandfather_maternal_id: formData.maternal_great_grandfather_maternal_id || '',
      maternal_great_grandmother_paternal_id: formData.maternal_great_grandmother_paternal_id || '',
      maternal_great_grandfather_paternal_id: formData.maternal_great_grandfather_paternal_id || '',
      paternal_great_grandmother_maternal_id: formData.paternal_great_grandmother_maternal_id || '',
      paternal_great_grandfather_maternal_id: formData.paternal_great_grandfather_maternal_id || '',
      paternal_great_grandmother_paternal_id: formData.paternal_great_grandmother_paternal_id || '',
      paternal_great_grandfather_paternal_id: formData.paternal_great_grandfather_paternal_id || '',
      // Generation 4
      gen4_paternal_ggggf_p: formData.gen4_paternal_ggggf_p || '',
      gen4_paternal_ggggm_p: formData.gen4_paternal_ggggm_p || '',
      gen4_paternal_gggmf_p: formData.gen4_paternal_gggmf_p || '',
      gen4_paternal_gggmm_p: formData.gen4_paternal_gggmm_p || '',
      gen4_paternal_ggfgf_p: formData.gen4_paternal_ggfgf_p || '',
      gen4_paternal_ggfgm_p: formData.gen4_paternal_ggfgm_p || '',
      gen4_paternal_ggmgf_p: formData.gen4_paternal_ggmgf_p || '',
      gen4_paternal_ggmgm_p: formData.gen4_paternal_ggmgm_p || '',
      gen4_maternal_ggggf_m: formData.gen4_maternal_ggggf_m || '',
      gen4_maternal_ggggm_m: formData.gen4_maternal_ggggm_m || '',
      gen4_maternal_gggmf_m: formData.gen4_maternal_gggmf_m || '',
      gen4_maternal_gggmm_m: formData.gen4_maternal_gggmm_m || '',
      gen4_maternal_ggfgf_m: formData.gen4_maternal_ggfgf_m || '',
      gen4_maternal_ggfgm_m: formData.gen4_maternal_ggfgm_m || '',
      gen4_maternal_ggmgf_m: formData.gen4_maternal_ggmgf_m || '',
      gen4_maternal_ggmgm_m: formData.gen4_maternal_ggmgm_m || '',
      // Generation 5
      gen5_paternal_1: formData.gen5_paternal_1 || '',
      gen5_paternal_2: formData.gen5_paternal_2 || '',
      gen5_paternal_3: formData.gen5_paternal_3 || '',
      gen5_paternal_4: formData.gen5_paternal_4 || '',
      gen5_paternal_5: formData.gen5_paternal_5 || '',
      gen5_paternal_6: formData.gen5_paternal_6 || '',
      gen5_paternal_7: formData.gen5_paternal_7 || '',
      gen5_paternal_8: formData.gen5_paternal_8 || '',
      gen5_paternal_9: formData.gen5_paternal_9 || '',
      gen5_paternal_10: formData.gen5_paternal_10 || '',
      gen5_paternal_11: formData.gen5_paternal_11 || '',
      gen5_paternal_12: formData.gen5_paternal_12 || '',
      gen5_paternal_13: formData.gen5_paternal_13 || '',
      gen5_paternal_14: formData.gen5_paternal_14 || '',
      gen5_paternal_15: formData.gen5_paternal_15 || '',
      gen5_paternal_16: formData.gen5_paternal_16 || '',
      gen5_maternal_1: formData.gen5_maternal_1 || '',
      gen5_maternal_2: formData.gen5_maternal_2 || '',
      gen5_maternal_3: formData.gen5_maternal_3 || '',
      gen5_maternal_4: formData.gen5_maternal_4 || '',
      gen5_maternal_5: formData.gen5_maternal_5 || '',
      gen5_maternal_6: formData.gen5_maternal_6 || '',
      gen5_maternal_7: formData.gen5_maternal_7 || '',
      gen5_maternal_8: formData.gen5_maternal_8 || '',
      gen5_maternal_9: formData.gen5_maternal_9 || '',
      gen5_maternal_10: formData.gen5_maternal_10 || '',
      gen5_maternal_11: formData.gen5_maternal_11 || '',
      gen5_maternal_12: formData.gen5_maternal_12 || '',
      gen5_maternal_13: formData.gen5_maternal_13 || '',
      gen5_maternal_14: formData.gen5_maternal_14 || '',
      gen5_maternal_15: formData.gen5_maternal_15 || '',
      gen5_maternal_16: formData.gen5_maternal_16 || ''
    };
    
    console.log('🔄 Final submit data:', submitData);
    
    updateMutation.mutate({ 
      id, 
      data: submitData 
    });
  };

  return {
    updateMutation,
    handleSubmit
  };
};
