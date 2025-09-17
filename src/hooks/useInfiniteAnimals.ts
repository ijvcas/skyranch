import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getAnimalsPageLean } from '@/services/animal/animalQueries';
import { mockAnimals } from '@/data/mockAnimals';
import type { Animal } from '@/stores/animalStore';

const PAGE_SIZE = 50;

export const useInfiniteAnimals = () => {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<Animal[], Error>({
    queryKey: ['animals', 'infinite-lean', 'all'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      
      try {
        const animals = await getAnimalsPageLean(PAGE_SIZE, offset, true);
        return animals;
      } catch (error) {
        // Only fallback to mock on actual database errors
        return mockAnimals;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) return undefined;
      return lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined;
    },
    staleTime: 3 * 60_000, // 3 minutes for faster data freshness
    gcTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error?.message?.includes('auth') || error?.message?.includes('JWT')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const animals = (query.data?.pages || []).flat();
  const isUsingMock = query.data?.pages?.[0] === mockAnimals;

  const clearAndRefetch = async () => {
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