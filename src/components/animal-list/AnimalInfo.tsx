
import React from 'react';
import type { Animal } from '@/stores/animalStore';
import { format, differenceInYears, differenceInMonths, differenceInDays, addYears, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTimezone } from '@/hooks/useTimezone';

interface AnimalInfoProps {
  animal: Animal;
}

const AnimalInfo: React.FC<AnimalInfoProps> = ({ animal }) => {
  const { formatDateInput } = useTimezone();
  const isDeceased = animal.lifecycleStatus === 'deceased';
  
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

  const ageText = formatAge(animal.birthDate);

  return (
    <div className="space-y-2 mb-4">
      {isDeceased && animal.dateOfDeath && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          <span className="font-medium">Fecha de fallecimiento:</span> {formatDateInput(animal.dateOfDeath)}
          {animal.causeOfDeath && (
            <div className="mt-1">
              <span className="font-medium">Causa:</span> {animal.causeOfDeath}
            </div>
          )}
        </div>
      )}
      {animal.birthDate && (
        <div className={`flex justify-between text-sm ${isDeceased ? 'text-gray-500' : 'text-gray-600'}`}>
          <span className="font-medium">Fecha de Nacimiento:</span>
          <span>{formatDateInput(animal.birthDate)} {ageText && `(${ageText})`}</span>
        </div>
      )}
      {animal.breed && (
        <div className={`flex justify-between text-sm ${isDeceased ? 'text-gray-500' : 'text-gray-600'}`}>
          <span className="font-medium">Raza:</span>
          <span>{animal.breed}</span>
        </div>
      )}
      <div className={`flex justify-between text-sm ${isDeceased ? 'text-gray-500' : 'text-gray-600'}`}>
        <span className="font-medium">Sexo:</span>
        <span>
          {animal.gender === 'macho' ? 'Macho' : animal.gender === 'hembra' ? 'Hembra' : 'No especificado'}
        </span>
      </div>
      {animal.weight && (
        <div className={`flex justify-between text-sm ${isDeceased ? 'text-gray-500' : 'text-gray-600'}`}>
          <span className="font-medium">Peso:</span>
          <span>{animal.weight} kg</span>
        </div>
      )}
    </div>
  );
};

export default AnimalInfo;
