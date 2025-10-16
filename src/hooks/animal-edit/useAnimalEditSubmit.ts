
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
      paternal_great_grandfather_paternal_id: formData.paternal_great_grandfather_paternal_id || ''
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
