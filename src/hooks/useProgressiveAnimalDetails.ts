import { useQuery } from '@tanstack/react-query';
import { getAnimalsPageLean } from '@/services/animal/animalQueries';
import { PERFORMANCE_CONFIG } from '@/utils/performanceConfig';
import type { Animal } from '@/stores/animalStore';

// Hook for progressively loading detailed animal information
export const useProgressiveAnimalDetails = (animalIds: string[], enabled = false) => {
  return useQuery<Animal[], Error>({
    queryKey: ['animals', 'progressive-details', animalIds.sort().join(',')],
    queryFn: async () => {
      if (animalIds.length === 0) return [];
      
      // For now, we'll fetch details for all animals in the visible set
      // In a more advanced implementation, we could batch requests
      const animals = await getAnimalsPageLean(animalIds.length, 0, true);
      return animals.filter(animal => animalIds.includes(animal.id));
    },
    enabled: enabled && animalIds.length > 0,
    staleTime: PERFORMANCE_CONFIG.CACHE_TIMES.ANIMAL_LIST,
    gcTime: PERFORMANCE_CONFIG.GC_TIMES.DEFAULT,
    refetchOnWindowFocus: false,
  });
};

// Hook to enhance ultra-lean animals with progressive details
export const useEnhancedAnimals = (ultraLeanAnimals: Animal[]) => {
  const visibleAnimalIds = ultraLeanAnimals.slice(0, PERFORMANCE_CONFIG.PAGINATION.MAX_VISIBLE_ITEMS).map(a => a.id);
  
  const { data: detailedAnimals } = useProgressiveAnimalDetails(
    visibleAnimalIds,
    ultraLeanAnimals.length > 0
  );

  // Merge ultra-lean data with detailed data where available
  return ultraLeanAnimals.map(leanAnimal => {
    const detailedAnimal = detailedAnimals?.find(d => d.id === leanAnimal.id);
    return detailedAnimal ? { ...leanAnimal, ...detailedAnimal } : leanAnimal;
  });
};