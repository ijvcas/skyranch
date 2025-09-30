import { useQuery } from '@tanstack/react-query';
import { getAnimalsLean } from '@/services/animal/animalQueries';

// Optimized hook for dashboard statistics - ultra-lean and fast
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats', 'lean'],
    queryFn: async () => {
      console.log('🔄 Fetching dashboard stats...');
      try {
        const animals = await getAnimalsLean(false);
        console.log('✅ Dashboard stats fetched:', animals?.length || 0, 'animals');
        return animals || [];
      } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        // Return empty array on error to prevent infinite loading
        return [];
      }
    },
    staleTime: 2 * 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1, // Only retry once
    select: (animals) => {
      const totalAnimals = animals?.length || 0;
      const speciesCounts = (animals || []).reduce((counts, animal) => {
        if (animal?.species) {
          counts[animal.species] = (counts[animal.species] || 0) + 1;
        }
        return counts;
      }, {} as Record<string, number>);
      
      console.log('📊 Dashboard stats computed:', { totalAnimals, speciesCounts });
      
      return {
        totalAnimals,
        speciesCounts,
        animals: animals || []
      };
    }
  });
};