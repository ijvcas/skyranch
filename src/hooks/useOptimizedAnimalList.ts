import { useQuery } from '@tanstack/react-query';
import { getAllAnimals } from '@/services/animal/animalQueries';
import type { Animal } from '@/stores/animalStore';

// Optimized hook for animal list page with smart caching
export const useOptimizedAnimalList = (includeDeceased = true) => {
  return useQuery<Animal[], Error>({
    queryKey: ['animals', 'optimized-list', includeDeceased ? 'all' : 'active'],
    queryFn: () => getAllAnimals(includeDeceased),
    staleTime: 3 * 60_000, // 3 minutes - good balance between freshness and performance
    gcTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('auth') || error?.message?.includes('JWT')) {
        return false;
      }
      return failureCount < 2;
    },
    // Transform data for better performance in components
    select: (animals) => {
      return animals.sort((a, b) => {
        // Sort by lifecycle status first (active first), then by creation date
        if (a.lifecycleStatus !== b.lifecycleStatus) {
          return a.lifecycleStatus === 'active' ? -1 : 1;
        }
        return new Date(b.birthDate || '1900-01-01').getTime() - new Date(a.birthDate || '1900-01-01').getTime();
      });
    }
  });
};