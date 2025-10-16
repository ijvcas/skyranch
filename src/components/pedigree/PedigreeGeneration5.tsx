import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PedigreeGeneration5Props {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  disabled?: boolean;
}

const PedigreeGeneration5 = ({ formData, onInputChange, disabled = false }: PedigreeGeneration5Props) => {
  const genderSymbol = (num: number) => num % 2 === 1 ? '♂' : '♀';
  
  const paternalFields = Array.from({ length: 16 }, (_, i) => ({
    id: `gen5Paternal${i + 1}`,
    label: `G5-P${i + 1} (${genderSymbol(i + 1)})`,
    placeholder: `Ancestro Paterno ${i + 1}`
  }));

  const maternalFields = Array.from({ length: 16 }, (_, i) => ({
    id: `gen5Maternal${i + 1}`,
    label: `G5-M${i + 1} (${genderSymbol(i + 1)})`,
    placeholder: `Ancestro Materno ${i + 1}`
  }));

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">5ta Generación (Tatarabuelos)</h3>
      
      {/* Paternal Line */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Línea Paterna (Lado del Padre) - 16 ancestros</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paternalFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                value={formData[field.id] || ''}
                onChange={(e) => onInputChange(field.id, e.target.value)}
                disabled={disabled}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Maternal Line */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Línea Materna (Lado de la Madre) - 16 ancestros</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {maternalFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                value={formData[field.id] || ''}
                onChange={(e) => onInputChange(field.id, e.target.value)}
                disabled={disabled}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PedigreeGeneration5;
