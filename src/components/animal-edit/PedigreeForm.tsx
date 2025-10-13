import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eraser } from 'lucide-react';
import PedigreeGreatGrandparents from '@/components/pedigree/PedigreeGreatGrandparents';
import PedigreeGrandparents from '@/components/pedigree/PedigreeGrandparents';
import PedigreeParents from '@/components/pedigree/PedigreeParents';
import PedigreeGeneration4 from '@/components/pedigree/PedigreeGeneration4';
import PedigreeGeneration5 from '@/components/pedigree/PedigreeGeneration5';
import PedigreeTextUploadSection from './PedigreeTextUploadSection';
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
    // Clear all pedigree fields
    const pedigreeFields = [
      'father_id', 'mother_id',
      'paternal_grandfather_id', 'paternal_grandmother_id',
      'maternal_grandfather_id', 'maternal_grandmother_id',
      'paternal_great_grandfather_paternal_id', 'paternal_great_grandmother_paternal_id',
      'paternal_great_grandfather_maternal_id', 'paternal_great_grandmother_maternal_id',
      'maternal_great_grandfather_paternal_id', 'maternal_great_grandmother_paternal_id',
      'maternal_great_grandfather_maternal_id', 'maternal_great_grandmother_maternal_id',
      'gen4_paternal_ggggf_p', 'gen4_paternal_ggggm_p', 'gen4_paternal_gggmf_p', 'gen4_paternal_gggmm_p',
      'gen4_paternal_ggfgf_p', 'gen4_paternal_ggfgm_p', 'gen4_paternal_ggmgf_p', 'gen4_paternal_ggmgm_p',
      'gen4_maternal_ggggf_m', 'gen4_maternal_ggggm_m', 'gen4_maternal_gggmf_m', 'gen4_maternal_gggmm_m',
      'gen4_maternal_ggfgf_m', 'gen4_maternal_ggfgm_m', 'gen4_maternal_ggmgf_m', 'gen4_maternal_ggmgm_m',
      ...Array.from({ length: 16 }, (_, i) => `gen5_paternal_${i + 1}`),
      ...Array.from({ length: 16 }, (_, i) => `gen5_maternal_${i + 1}`)
    ];

    pedigreeFields.forEach(field => onInputChange(field, ''));

    toast({
      title: 'Pedigrí Limpiado',
      description: 'Todos los campos de pedigrí han sido borrados.',
    });
  };

  return (
    <>
      <PedigreeTextUploadSection 
        onInputChange={onInputChange} 
        disabled={disabled} 
      />
      
      <Card className="shadow-lg mt-4">
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
        <Tabs defaultValue="gen1" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="gen1">Gen 1</TabsTrigger>
            <TabsTrigger value="gen2">Gen 2</TabsTrigger>
            <TabsTrigger value="gen3">Gen 3</TabsTrigger>
            <TabsTrigger value="gen4">Gen 4</TabsTrigger>
            <TabsTrigger value="gen5">Gen 5</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gen1" className="mt-6">
            <PedigreeParents 
              formData={formData} 
              onInputChange={onInputChange} 
              disabled={disabled} 
            />
          </TabsContent>
          
          <TabsContent value="gen2" className="mt-6">
            <PedigreeGrandparents 
              formData={formData} 
              onInputChange={onInputChange} 
              disabled={disabled} 
            />
          </TabsContent>
          
          <TabsContent value="gen3" className="mt-6">
            <PedigreeGreatGrandparents 
              formData={formData} 
              onInputChange={onInputChange} 
              disabled={disabled} 
            />
          </TabsContent>
          
          <TabsContent value="gen4" className="mt-6">
            <PedigreeGeneration4 
              formData={formData} 
              onInputChange={onInputChange} 
              disabled={disabled} 
            />
          </TabsContent>
          
          <TabsContent value="gen5" className="mt-6">
            <PedigreeGeneration5 
              formData={formData} 
              onInputChange={onInputChange} 
              disabled={disabled} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </>
  );
};

export default PedigreeForm;
