
import React from 'react';
import type { Animal } from '@/stores/animalStore';
import { format, differenceInYears, differenceInMonths, differenceInDays, addYears, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface AnimalInfoProps {
  animal: Animal;
}

const AnimalInfo: React.FC<AnimalInfoProps> = ({ animal }) => {
  const formatAge = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const dob = new Date(dateStr);
      const now = new Date();
      const years = differenceInYears(now, dob);
      const totalMonths = differenceInMonths(now, dob);
      const months = totalMonths - years * 12;
      const base = addMonths(addYears(dob, years), months);
      const days = Math.max(0, differenceInDays(now, base));
      const parts: string[] = [];
      if (years) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
      if (months) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
      if (!years && !months) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
      return parts.join(' ');
    } catch {
      return null;
    }
  };

  const birthDateFormatted = animal.birthDate
    ? format(new Date(animal.birthDate), 'dd/MM/yyyy', { locale: es })
    : null;
  const ageText = formatAge(animal.birthDate);

  return (
    <div className="space-y-2">
      {birthDateFormatted && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Fecha de Nacimiento:</span>
          <span className="font-medium">{birthDateFormatted}</span>
        </div>
      )}
      {ageText && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Edad:</span>
          <span className="font-medium">{ageText}</span>
        </div>
      )}
      {animal.breed && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Raza:</span>
          <span className="font-medium">{animal.breed}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Sexo:</span>
        <span className="font-medium">
          {animal.gender === 'macho' ? 'Macho' : animal.gender === 'hembra' ? 'Hembra' : 'No especificado'}
        </span>
      </div>
      {animal.weight && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Peso:</span>
          <span className="font-medium">{animal.weight} kg</span>
        </div>
      )}
    </div>
  );
};

export default AnimalInfo;
