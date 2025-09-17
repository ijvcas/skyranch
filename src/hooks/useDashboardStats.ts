import { useQuery } from '@tanstack/react-query';
import { getAnimalsLean } from '@/services/animal/animalQueries';

// Optimized hook for dashboard statistics - ultra-lean and fast
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats', 'lean'],
    queryFn: () => getAnimalsLean(false), // Only active animals for stats
    staleTime: 2 * 60_000, // 2 minutes for faster updates
    gcTime: 5 * 60_000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('auth') || error?.message?.includes('JWT')) {
        return false;
      }
      return failureCount < 2;
    },
    select: (animals) => {
      // Process data in the query selector for better performance
      const totalAnimals = animals.length;
      const speciesCounts = animals.reduce((counts, animal) => {
        counts[animal.species] = (counts[animal.species] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      return {
        totalAnimals,
        speciesCounts,
        animals
      };
    }
  });
};