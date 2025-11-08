
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAnimal } from '@/services/animalService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface AnimalDeleteDialogProps {
  animalId: string;
  animalName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  redirectAfterDelete?: boolean;
}

const AnimalDeleteDialog: React.FC<AnimalDeleteDialogProps> = ({
  animalId,
  animalName,
  isOpen,
  onOpenChange,
  redirectAfterDelete = false
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['animals', 'common']);

  const deleteMutation = useMutation({
    mutationFn: () => deleteAnimal(animalId),
    onSuccess: (success) => {
      if (success) {
        toast({
          title: t('animals:delete.success'),
          description: t('animals:delete.successDesc', { name: animalName }),
        });
        
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['animals'] });
        
        onOpenChange(false);
        
        if (redirectAfterDelete) {
          navigate('/animals');
        }
      } else {
        toast({
          title: t('common:common.error'),
          description: t('animals:delete.failed'),
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error deleting animal:', error);
      toast({
        title: t('common:common.error'),
        description: t('animals:delete.error'),
        variant: "destructive",
      });
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            {t('animals:delete.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('animals:delete.confirmMessage', { name: animalName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t('common:actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('animals:delete.deleting')}
              </div>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {t('common:actions.delete')}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AnimalDeleteDialog;
