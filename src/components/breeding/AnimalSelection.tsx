
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Animal } from '@/stores/animalStore';

interface AnimalSelectionProps {
  motherId: string;
  fatherId: string;
  animals: Animal[];
  onMotherChange: (value: string) => void;
  onFatherChange: (value: string) => void;
  selectedSpecies?: string;
}

const AnimalSelection: React.FC<AnimalSelectionProps> = ({
  motherId,
  fatherId,
  animals,
  onMotherChange,
  onFatherChange,
  selectedSpecies
}) => {
  // Filter by species first, then by gender
  const speciesFilteredAnimals = selectedSpecies 
    ? animals.filter(animal => animal.species === selectedSpecies)
    : animals;

  const femaleAnimals = speciesFilteredAnimals.filter(animal => {
    const gender = animal.gender?.toLowerCase().trim();
    return gender === 'female' || gender === 'hembra' || gender === 'f';
  });

  const maleAnimals = speciesFilteredAnimals.filter(animal => {
    const gender = animal.gender?.toLowerCase().trim();
    return gender === 'male' || gender === 'macho' || gender === 'm';
  });

  // Debug logging to understand what gender values we have
  console.log('🐄 AnimalSelection - Gender Analysis:', {
    totalAnimals: animals.length,
    femaleAnimals: femaleAnimals.length,
    maleAnimals: maleAnimals.length,
    allGenderValues: animals.map(a => ({ id: a.id, name: a.name, gender: a.gender }))
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="motherId">Madre *</Label>
        <Select 
          value={motherId} 
          onValueChange={(value) => {
            console.log('🐄 Mother selected:', value);
            onMotherChange(value);
          }}
        >
          <SelectTrigger className="w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500">
            <SelectValue placeholder="Seleccionar madre" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto z-[60] bg-white border border-gray-200 shadow-lg">
            {femaleAnimals.length === 0 ? (
              <div className="p-3 text-gray-500 text-sm">
                {animals.length === 0 ? 'No hay animales registrados' : 'No hay hembras disponibles'}
                <div className="text-xs mt-1 text-gray-400">
                  Total animales: {animals.length}
                </div>
              </div>
            ) : (
              femaleAnimals.map((animal) => (
                <SelectItem 
                  key={animal.id} 
                  value={animal.id} 
                  className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 pl-8"
                >
                  {animal.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fatherId">Padre *</Label>
        <Select 
          value={fatherId} 
          onValueChange={(value) => {
            console.log('🐄 Father selected:', value);
            onFatherChange(value);
          }}
        >
          <SelectTrigger className="w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500">
            <SelectValue placeholder="Seleccionar padre" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto z-[60] bg-white border border-gray-200 shadow-lg">
            {maleAnimals.length === 0 ? (
              <div className="p-3 text-gray-500 text-sm">
                {animals.length === 0 ? 'No hay animales registrados' : 'No hay machos disponibles'}
                <div className="text-xs mt-1 text-gray-400">
                  Total animales: {animals.length}
                </div>
              </div>
            ) : (
              maleAnimals.map((animal) => (
                <SelectItem 
                  key={animal.id} 
                  value={animal.id} 
                  className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 pl-8"
                >
                  {animal.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AnimalSelection;
