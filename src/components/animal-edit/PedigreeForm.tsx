import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Eraser, Info } from 'lucide-react';
import HorizontalPedigreeInputTree from '@/components/pedigree/HorizontalPedigreeInputTree';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  const maxGeneration = parseInt(formData.pedigreeMaxGeneration || '5');

  return (
    <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-gray-900">Información de Pedigrí</CardTitle>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={disabled} title="Limpiar Pedigrí">
                  <Eraser className="w-5 h-5" />
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
          <div className="flex items-center gap-4 mb-4 pb-4 border-b">
            <Label htmlFor="pedigree-depth" className="text-sm font-medium whitespace-nowrap">
              Profundidad de Pedigrí:
            </Label>
            <Select 
              value={formData.pedigreeMaxGeneration?.toString() || '5'}
              onValueChange={(val) => onInputChange('pedigreeMaxGeneration', val)}
              disabled={disabled}
            >
              <SelectTrigger id="pedigree-depth" className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Gen 1 - Solo Padres</SelectItem>
                <SelectItem value="2">Gen 2 - Hasta Abuelos</SelectItem>
                <SelectItem value="3">Gen 3 - Hasta Bisabuelos</SelectItem>
                <SelectItem value="4">Gen 4 - Hasta Tatarabuelos</SelectItem>
                <SelectItem value="5">Gen 5 - Completo (5 Generaciones)</SelectItem>
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Selecciona hasta qué generación conoces el pedigrí. Esto optimiza el espacio y los respaldos.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <HorizontalPedigreeInputTree
            formData={formData}
            onInputChange={onInputChange}
            disabled={disabled}
            animalName={animalName}
            maxGeneration={maxGeneration}
          />
        </CardContent>
    </Card>
  );
};

export default PedigreeForm;
