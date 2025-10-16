import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PedigreeGeneration4Props {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  disabled?: boolean;
}

const PedigreeGeneration4 = ({ formData, onInputChange, disabled = false }: PedigreeGeneration4Props) => {
  const paternalFields = [
    { id: 'gen4PaternalGgggfP', label: 'G4-P1 (♂)', placeholder: 'Bisabuelo Paterno 1' },
    { id: 'gen4PaternalGgggmP', label: 'G4-P2 (♀)', placeholder: 'Bisabuela Paterna 2' },
    { id: 'gen4PaternalGggmfP', label: 'G4-P3 (♂)', placeholder: 'Bisabuelo Paterno 3' },
    { id: 'gen4PaternalGggmmP', label: 'G4-P4 (♀)', placeholder: 'Bisabuela Paterna 4' },
    { id: 'gen4PaternalGgfgfP', label: 'G4-P5 (♂)', placeholder: 'Bisabuelo Paterno 5' },
    { id: 'gen4PaternalGgfgmP', label: 'G4-P6 (♀)', placeholder: 'Bisabuela Paterna 6' },
    { id: 'gen4PaternalGgmgfP', label: 'G4-P7 (♂)', placeholder: 'Bisabuelo Paterno 7' },
    { id: 'gen4PaternalGgmgmP', label: 'G4-P8 (♀)', placeholder: 'Bisabuela Paterna 8' },
  ];

  const maternalFields = [
    { id: 'gen4MaternalGgggfM', label: 'G4-M1 (♂)', placeholder: 'Bisabuelo Materno 1' },
    { id: 'gen4MaternalGgggmM', label: 'G4-M2 (♀)', placeholder: 'Bisabuela Materna 2' },
    { id: 'gen4MaternalGggmfM', label: 'G4-M3 (♂)', placeholder: 'Bisabuelo Materno 3' },
    { id: 'gen4MaternalGggmmM', label: 'G4-M4 (♀)', placeholder: 'Bisabuela Materna 4' },
    { id: 'gen4MaternalGgfgfM', label: 'G4-M5 (♂)', placeholder: 'Bisabuelo Materno 5' },
    { id: 'gen4MaternalGgfgmM', label: 'G4-M6 (♀)', placeholder: 'Bisabuela Materna 6' },
    { id: 'gen4MaternalGgmgfM', label: 'G4-M7 (♂)', placeholder: 'Bisabuelo Materno 7' },
    { id: 'gen4MaternalGgmgmM', label: 'G4-M8 (♀)', placeholder: 'Bisabuela Materna 8' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">4ta Generación (Bisabuelos)</h3>
      
      {/* Paternal Line */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Línea Paterna (Lado del Padre) - 8 ancestros</h4>
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
        <h4 className="font-medium text-gray-700">Línea Materna (Lado de la Madre) - 8 ancestros</h4>
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

export default PedigreeGeneration4;
