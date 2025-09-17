import React, { useMemo } from 'react';
import AnimalCard from '@/components/animal-list/AnimalCard';
import type { Animal } from '@/stores/animalStore';

interface AnimalVirtualListProps {
  animals: Animal[];
  onDeleteAnimal: (id: string, name: string) => void;
  maxVisible?: number;
}

// Optimized animal list with chunked rendering for better performance
const AnimalVirtualList: React.FC<AnimalVirtualListProps> = ({
  animals,
  onDeleteAnimal,
  maxVisible = 100
}) => {
  // Memoize the visible animals to prevent unnecessary re-renders
  const visibleAnimals = useMemo(() => {
    return animals.slice(0, maxVisible);
  }, [animals, maxVisible]);

  const hasMoreAnimals = animals.length > maxVisible;

  if (animals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay animales para mostrar
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleAnimals.map((animal) => (
        <AnimalCard
          key={animal.id}
          animal={animal}
          onDelete={onDeleteAnimal}
        />
      ))}
      
      {hasMoreAnimals && (
        <div className="text-center py-4 text-sm text-muted-foreground bg-gray-50 rounded-md">
          Mostrando {maxVisible} de {animals.length} animales
          <br />
          <span className="text-xs">
            Use los filtros para refinar la búsqueda
          </span>
        </div>
      )}
    </div>
  );
};

export default AnimalVirtualList;