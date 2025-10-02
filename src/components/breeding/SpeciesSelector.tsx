import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Animal } from '@/stores/animalStore';

interface SpeciesSelectorProps {
  animals: Animal[];
  selectedSpecies: string;
  onSpeciesChange: (species: string) => void;
}

const SpeciesSelector: React.FC<SpeciesSelectorProps> = ({
  animals,
  selectedSpecies,
  onSpeciesChange
}) => {
  // Get unique species from animals
  const availableSpecies = React.useMemo(() => {
    const speciesSet = new Set<string>();
    animals.forEach(animal => {
      if (animal.species) {
        speciesSet.add(animal.species);
      }
    });
    return Array.from(speciesSet).sort();
  }, [animals]);

  return (
    <div className="space-y-2">
      <Label htmlFor="species">Especie *</Label>
      <Select value={selectedSpecies} onValueChange={onSpeciesChange}>
        <SelectTrigger className="w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500">
          <SelectValue placeholder="Seleccionar especie primero" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px] overflow-y-auto z-[60] bg-white border border-gray-200 shadow-lg">
          {availableSpecies.length === 0 ? (
            <div className="p-3 text-gray-500 text-sm">
              No hay especies disponibles
            </div>
          ) : (
            availableSpecies.map((species) => (
              <SelectItem 
                key={species} 
                value={species}
                className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 pl-8"
              >
                {species}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SpeciesSelector;
