
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAnimals } from '@/services/animalService';

export const useAnimalNames = () => {
  const { data: allAnimals = [] } = useQuery({
    queryKey: ['animals', 'all-users'],
    queryFn: getAllAnimals,
  });

  // Create a simple map of registered animal IDs to their display names
  const animalNamesMap = React.useMemo(() => {
    const nameMap: Record<string, string> = {};
    allAnimals.forEach(animal => {
      nameMap[animal.id] = `${animal.name} (${animal.tag})`;
    });
    return nameMap;
  }, [allAnimals]);

  // Returns "Name (TAG)" for registered animals; otherwise returns the value as-is
  const getDisplayName = React.useCallback((parentId: string | undefined): string | null => {
    if (!parentId) return null;
    if (animalNamesMap[parentId]) {
      return animalNamesMap[parentId];
    }
    return parentId;
  }, [animalNamesMap]);

  // Returns just the name for registered animals; otherwise returns the value as-is
  const getNameOnly = React.useCallback((parentId: string | undefined): string | null => {
    if (!parentId) return null;
    const found = allAnimals.find(a => a.id === parentId);
    if (found) return found.name;
    return parentId;
  }, [allAnimals]);

  return {
    getDisplayName,
    getNameOnly,
    animalNamesMap
  };
};
