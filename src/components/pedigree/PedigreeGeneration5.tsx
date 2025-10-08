import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PedigreeGeneration5Props {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  disabled?: boolean;
}

const PedigreeGeneration5 = ({ formData, onInputChange, disabled = false }: PedigreeGeneration5Props) => {
  const paternalFields = Array.from({ length: 16 }, (_, i) => i + 1);
  const maternalFields = Array.from({ length: 16 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">5ta Generación (Choznos)</h3>
      
      {/* Paternal Line */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Línea Paterna (Lado del Padre)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paternalFields.map((num) => (
            <div key={`gen5_paternal_${num}`} className="space-y-2">
              <Label htmlFor={`gen5_paternal_${num}`}>Chozno Paterno {num}</Label>
              <Input
                id={`gen5_paternal_${num}`}
                value={formData[`gen5Paternal${num}`] || ''}
                onChange={(e) => onInputChange(`gen5Paternal${num}`, e.target.value)}
                disabled={disabled}
                placeholder={`Ancestro ${num}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Maternal Line */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Línea Materna (Lado de la Madre)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {maternalFields.map((num) => (
            <div key={`gen5_maternal_${num}`} className="space-y-2">
              <Label htmlFor={`gen5_maternal_${num}`}>Chozno Materno {num}</Label>
              <Input
                id={`gen5_maternal_${num}`}
                value={formData[`gen5Maternal${num}`] || ''}
                onChange={(e) => onInputChange(`gen5Maternal${num}`, e.target.value)}
                disabled={disabled}
                placeholder={`Ancestro ${num}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PedigreeGeneration5;
