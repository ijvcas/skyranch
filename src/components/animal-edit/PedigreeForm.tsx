import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eraser } from 'lucide-react';
import HorizontalPedigreeInputTree from '@/components/pedigree/HorizontalPedigreeInputTree';
import { useToast } from '@/hooks/use-toast';

interface PedigreeFormProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  disabled?: boolean;
  animalId?: string;
  animalName?: string;
}

const PedigreeForm = ({ formData, onInputChange, disabled = false, animalId, animalName }: PedigreeFormProps) => {
  const { toast } = useToast();

  const handleClearPedigree = () => {
    // Clear all pedigree fields (62 fields total)
    const pedigreeFields = [
      'fatherId', 'motherId',
      'paternal_grandfather_id', 'paternal_grandmother_id',
      'maternal_grandfather_id', 'maternal_grandmother_id',
      'paternal_great_grandfather_paternal_id', 'paternal_great_grandmother_paternal_id',
      'paternal_great_grandfather_maternal_id', 'paternal_great_grandmother_maternal_id',
      'maternal_great_grandfather_paternal_id', 'maternal_great_grandmother_paternal_id',
      'maternal_great_grandfather_maternal_id', 'maternal_great_grandmother_maternal_id',
      'gen4PaternalGgggfP', 'gen4PaternalGgggmP', 'gen4PaternalGggmfP', 'gen4PaternalGggmmP',
      'gen4PaternalGgfgfP', 'gen4PaternalGgfgmP', 'gen4PaternalGgmgfP', 'gen4PaternalGgmgmP',
      'gen4MaternalGgggfM', 'gen4MaternalGgggmM', 'gen4MaternalGggmfM', 'gen4MaternalGggmmM',
      'gen4MaternalGgfgfM', 'gen4MaternalGgfgmM', 'gen4MaternalGgmgfM', 'gen4MaternalGgmgmM',
      ...Array.from({ length: 16 }, (_, i) => `gen5Paternal${i + 1}`),
      ...Array.from({ length: 16 }, (_, i) => `gen5Maternal${i + 1}`)
    ];

    pedigreeFields.forEach(field => onInputChange(field, ''));

    toast({
      title: 'Pedigrí Limpiado',
      description: 'Todos los campos de pedigrí han sido borrados.',
    });
  };

  return (
    <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-gray-900">Información de Pedigrí (5 Generaciones)</CardTitle>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={disabled}>
                  <Eraser className="w-4 h-4 mr-2" />
                  Limpiar Pedigrí
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Limpiar todo el pedigrí?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción borrará todos los campos de pedigrí (5 generaciones). Esta acción no se puede deshacer hasta que guardes los cambios.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearPedigree}>
                    Limpiar Todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <HorizontalPedigreeInputTree
            formData={formData}
            onInputChange={onInputChange}
            disabled={disabled}
            animalName={animalName}
          />
        </CardContent>
    </Card>
  );
};

export default PedigreeForm;
