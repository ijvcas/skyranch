import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getAnimalsPage } from '@/services/animal/animalQueries';
import { networkDiagnostics } from '@/utils/networkDiagnostics';
import { mockAnimals } from '@/data/mockAnimals';
import type { Animal } from '@/stores/animalStore';

const PAGE_SIZE = 50;

export const useInfiniteAnimals = () => {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<Animal[], Error>({
    queryKey: ['animals', 'farm-wide', 'infinite', 'all'], // Always fetch both active and deceased
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      
      // Skip network diagnostics for better performance - rely on RLS and error handling
      try {
        const animals = await getAnimalsPage(PAGE_SIZE, offset, true); // Always include deceased
        return animals;
      } catch (error) {
        console.warn('❌ Database query failed, using mock data:', error);
        // Only fallback to mock on actual database errors
        return mockAnimals;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) return undefined;
      // If we received a full page, assume there may be more
      return lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined;
    },
    staleTime: 5 * 60_000, // 5 minutes - longer cache for better performance
    gcTime: 15 * 60_000, // 15 minutes - keep data longer
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Only retry on network errors, not auth errors
      if (error?.message?.includes('auth') || error?.message?.includes('JWT')) {
        return false;
      }
      return failureCount < 2; // Max 2 retries
    },
  });

  const animals = (query.data?.pages || []).flat();
  const isUsingMock = query.data?.pages?.[0] === mockAnimals;

  const clearAndRefetch = async () => {
    // Smart cache invalidation - only clear animal-related queries
    queryClient.removeQueries({ queryKey: ['animals'] });
    await query.refetch();
  };

  return {
    animals,
    isLoading: query.isLoading,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
    clearAndRefetch,
    isUsingMock,
  };
};