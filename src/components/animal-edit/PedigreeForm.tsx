import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PedigreeGreatGrandparents from '@/components/pedigree/PedigreeGreatGrandparents';
import PedigreeGrandparents from '@/components/pedigree/PedigreeGrandparents';
import PedigreeParents from '@/components/pedigree/PedigreeParents';

interface PedigreeFormProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  disabled?: boolean;
}

const PedigreeForm = ({ formData, onInputChange, disabled = false }: PedigreeFormProps) => {

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">Información de Pedigrí (3 Generaciones)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <PedigreeGreatGrandparents 
          formData={formData} 
          onInputChange={onInputChange} 
          disabled={disabled} 
        />
        <PedigreeGrandparents 
          formData={formData} 
          onInputChange={onInputChange} 
          disabled={disabled} 
        />
        <PedigreeParents 
          formData={formData} 
          onInputChange={onInputChange} 
          disabled={disabled} 
        />
      </CardContent>
    </Card>
  );
};

export default PedigreeForm;
