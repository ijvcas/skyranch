import React, { useMemo } from 'react';
import AnimalCard from '@/components/animal-list/AnimalCard';
import type { Animal } from '@/stores/animalStore';
import { performanceUtils } from '@/utils/performanceConfig';

interface AnimalVirtualListProps {
  animals: Animal[];
  onDeleteAnimal: (id: string, name: string) => void;
  maxVisible?: number;
}

// Optimized animal list with adaptive rendering for mobile
const AnimalVirtualList: React.FC<AnimalVirtualListProps> = ({
  animals,
  onDeleteAnimal,
  maxVisible
}) => {
  // OPTIMIZED: Adjust max visible based on device (mobile gets fewer items)
  const adaptiveMaxVisible = useMemo(() => {
    if (maxVisible) return maxVisible;
    return performanceUtils.getOptimalBatchSize();
  }, [maxVisible]);

  // Memoize the visible animals to prevent unnecessary re-renders
  const visibleAnimals = useMemo(() => {
    return animals.slice(0, adaptiveMaxVisible);
  }, [animals, adaptiveMaxVisible]);

  const hasMoreAnimals = animals.length > adaptiveMaxVisible;

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
          Mostrando {adaptiveMaxVisible} de {animals.length} animales
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