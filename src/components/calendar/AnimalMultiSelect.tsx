import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, X } from 'lucide-react';
import { Animal } from '@/stores/animalStore';

interface AnimalMultiSelectProps {
  animals: Animal[];
  selectedAnimalIds: string[];
  onChange: (selectedIds: string[]) => void;
  label?: string;
}

const AnimalMultiSelect = ({ 
  animals, 
  selectedAnimalIds, 
  onChange, 
  label = "Animales (Opcional)" 
}: AnimalMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Group animals by species
  const animalsBySpecies = useMemo(() => {
    const grouped: Record<string, Animal[]> = {};
    animals.forEach(animal => {
      const species = animal.species || 'Sin especie';
      if (!grouped[species]) {
        grouped[species] = [];
      }
      grouped[species].push(animal);
    });
    
    // Sort animals within each species by name
    Object.keys(grouped).forEach(species => {
      grouped[species].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return grouped;
  }, [animals]);

  const selectedAnimals = useMemo(() => {
    return animals.filter(animal => selectedAnimalIds.includes(animal.id));
  }, [animals, selectedAnimalIds]);

  const handleAnimalToggle = (animalId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedAnimalIds, animalId]);
    } else {
      onChange(selectedAnimalIds.filter(id => id !== animalId));
    }
  };

  const handleSpeciesToggle = (species: string, checked: boolean) => {
    const speciesAnimalIds = animalsBySpecies[species].map(animal => animal.id);
    
    if (checked) {
      // Add all animals from this species that aren't already selected
      const newIds = speciesAnimalIds.filter(id => !selectedAnimalIds.includes(id));
      onChange([...selectedAnimalIds, ...newIds]);
    } else {
      // Remove all animals from this species
      onChange(selectedAnimalIds.filter(id => !speciesAnimalIds.includes(id)));
    }
  };

  const isSpeciesFullySelected = (species: string) => {
    const speciesAnimalIds = animalsBySpecies[species].map(animal => animal.id);
    return speciesAnimalIds.every(id => selectedAnimalIds.includes(id));
  };

  const isSpeciesPartiallySelected = (species: string) => {
    const speciesAnimalIds = animalsBySpecies[species].map(animal => animal.id);
    return speciesAnimalIds.some(id => selectedAnimalIds.includes(id)) && 
           !speciesAnimalIds.every(id => selectedAnimalIds.includes(id));
  };

  const removeAnimal = (animalId: string) => {
    onChange(selectedAnimalIds.filter(id => id !== animalId));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Selected animals display */}
      {selectedAnimals.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
          {selectedAnimals.map(animal => (
            <Badge key={animal.id} variant="secondary" className="flex items-center gap-1">
              {animal.name} (#{animal.tag})
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => removeAnimal(animal.id)}
              />
            </Badge>
          ))}
          {selectedAnimals.length > 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              Limpiar todo
            </Button>
          )}
        </div>
      )}

      {/* Dropdown trigger */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between text-left"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="text-muted-foreground">
              {selectedAnimals.length > 0 
                ? `${selectedAnimals.length} animal(es) seleccionado(s)`
                : "Seleccionar animales"
              }
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="start">
          <ScrollArea className="h-72">
            <div className="p-4 space-y-4">
              {Object.keys(animalsBySpecies).sort().map(species => (
                <div key={species} className="space-y-2">
                  {/* Species header with toggle */}
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Checkbox
                      id={`species-${species}`}
                      checked={isSpeciesFullySelected(species)}
                      ref={(el) => {
                        if (el && isSpeciesPartiallySelected(species)) {
                          const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
                          if (checkbox) {
                            checkbox.indeterminate = true;
                          }
                        }
                      }}
                      onCheckedChange={(checked) => 
                        handleSpeciesToggle(species, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`species-${species}`}
                      className="font-medium text-sm cursor-pointer flex-1"
                    >
                      {species} ({animalsBySpecies[species].length})
                    </Label>
                  </div>
                  
                  {/* Animals in this species */}
                  <div className="pl-6 space-y-2">
                    {animalsBySpecies[species].map(animal => (
                      <div key={animal.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={animal.id}
                          checked={selectedAnimalIds.includes(animal.id)}
                          onCheckedChange={(checked) => 
                            handleAnimalToggle(animal.id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={animal.id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {animal.name} (#{animal.tag})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {Object.keys(animalsBySpecies).length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No hay animales disponibles
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default AnimalMultiSelect;