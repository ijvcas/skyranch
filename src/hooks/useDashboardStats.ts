import { useQuery } from '@tanstack/react-query';
import { getAnimalsLean } from '@/services/animal/animalQueries';

// Optimized hook for dashboard statistics - ultra-lean and fast
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats', 'lean'],
    queryFn: async () => {
      console.log('🔄 Fetching dashboard stats...');
      const animals = await getAnimalsLean(false); // Only active animals for stats
      console.log('✅ Dashboard stats fetched:', animals.length, 'animals');
      return animals;
    },
    staleTime: 2 * 60_000, // 2 minutes for faster updates
    gcTime: 5 * 60_000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.log('🔄 Dashboard stats retry attempt:', failureCount, error);
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
      
      // Filter out species with 0 count
      const filteredSpeciesCounts = Object.fromEntries(
        Object.entries(speciesCounts).filter(([_, count]) => count > 0)
      );
      
      console.log('📊 Dashboard stats computed:', { totalAnimals, speciesCounts: filteredSpeciesCounts });
      
      return {
        totalAnimals,
        speciesCounts: filteredSpeciesCounts,
        animals
      };
    }
  });
};