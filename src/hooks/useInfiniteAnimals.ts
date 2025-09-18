import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getAnimalsPageUltraLean } from '@/services/animal/animalQueries';
import { PERFORMANCE_CONFIG } from '@/utils/performanceConfig';
import type { Animal } from '@/stores/animalStore';

const PAGE_SIZE = PERFORMANCE_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;

export const useInfiniteAnimals = () => {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<Animal[], Error>({
    queryKey: ['animals', 'infinite-ultra-lean', 'all'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      
      try {
        const animals = await getAnimalsPageUltraLean(PAGE_SIZE, offset, true);
        return animals;
      } catch (error) {
        console.error('Error fetching animals page:', error);
        throw error; // Let React Query handle the error properly
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) return undefined;
      return lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined;
    },
    staleTime: PERFORMANCE_CONFIG.CACHE_TIMES.ANIMAL_LEAN,
    gcTime: PERFORMANCE_CONFIG.GC_TIMES.EXTENDED,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error?.message?.includes('auth') || error?.message?.includes('JWT')) {
        return false;
      }
      return failureCount < PERFORMANCE_CONFIG.RETRY.MAX_RETRIES;
    },
  });

  const animals = (query.data?.pages || []).flat();
  const isUsingMock = false; // No longer using mock data

  const clearAndRefetch = async () => {
    // Clear both ultra-lean and enhanced queries
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