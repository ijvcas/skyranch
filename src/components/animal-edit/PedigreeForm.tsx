import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PedigreeGreatGrandparents from '@/components/pedigree/PedigreeGreatGrandparents';
import PedigreeGrandparents from '@/components/pedigree/PedigreeGrandparents';
import PedigreeParents from '@/components/pedigree/PedigreeParents';
import PedigreeGeneration4 from '@/components/pedigree/PedigreeGeneration4';
import PedigreeGeneration5 from '@/components/pedigree/PedigreeGeneration5';

interface PedigreeFormProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  disabled?: boolean;
  animalId?: string;
  animalName?: string;
}

const PedigreeForm = ({ formData, onInputChange, disabled = false, animalId, animalName }: PedigreeFormProps) => {

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">Información de Pedigrí (5 Generaciones)</CardTitle>
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
  );
};

export default PedigreeForm;
