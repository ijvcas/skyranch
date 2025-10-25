import { useQuery } from '@tanstack/react-query';
import { getAnimalsLean } from '@/services/animal/animalQueries';

// Optimized hook for dashboard statistics - ultra-lean and fast
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats', 'lean'],
    queryFn: async () => {
      console.log('🔄 Fetching dashboard stats...');
      
      // Add timeout protection
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 10000); // 10 second timeout
      });
      
      try {
        const animalsPromise = getAnimalsLean(false);
        const animals = await Promise.race([animalsPromise, timeoutPromise]);
        console.log('✅ Dashboard stats fetched:', animals?.length || 0, 'animals');
        return Array.isArray(animals) ? animals : [];
      } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        // Return empty array on error to prevent infinite loading
        return [];
      }
    },
    staleTime: 2 * 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1000,
    // Add default data to prevent undefined state
    placeholderData: [],
    select: (animals) => {
      const safeAnimals = Array.isArray(animals) ? animals : [];
      const totalAnimals = safeAnimals.length;
      const speciesCounts = safeAnimals.reduce((counts, animal) => {
        if (animal?.species) {
          counts[animal.species] = (counts[animal.species] || 0) + 1;
        }
        return counts;
      }, {} as Record<string, number>);
      
      console.log('📊 Dashboard stats computed:', { totalAnimals, speciesCounts });
      
      return {
        totalAnimals,
        speciesCounts,
        animals: safeAnimals
      };
    }
  });
};