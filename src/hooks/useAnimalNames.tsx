
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAnimals } from '@/services/animalService';

export const useAnimalNames = () => {
  const { data: allAnimals = [] } = useQuery({
    queryKey: ['animals', 'all-users'],
    queryFn: () => getAllAnimals(false),
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
    
    // Debug logging for parent resolution
    if (parentId && parentId.includes('-')) { // UUID check
      console.log(`🔍 useAnimalNames Debug - parentId: ${parentId}:`, {
        inMap: !!animalNamesMap[parentId],
        mapValue: animalNamesMap[parentId],
        totalAnimalsInMap: Object.keys(animalNamesMap).length,
        allAnimalIds: Object.keys(animalNamesMap).slice(0, 5) // First 5 IDs for debugging
      });
    }
    
    if (animalNamesMap[parentId]) {
      return animalNamesMap[parentId];
    }
    
    // If not found in map but looks like UUID, try to find in allAnimals array
    const animal = allAnimals.find(a => a.id === parentId);
    if (animal) {
      console.log(`🔧 Found animal directly: ${animal.name} (${animal.tag})`);
      return `${animal.name} (${animal.tag})`;
    }
    
    // Return the parentId as-is for external animals (non-UUID strings)
    return parentId;
  }, [animalNamesMap, allAnimals]);

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
