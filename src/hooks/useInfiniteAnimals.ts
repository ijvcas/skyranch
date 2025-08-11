
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getAnimalsPage } from '@/services/animal/animalQueries';
import { networkDiagnostics } from '@/utils/networkDiagnostics';
import { mockAnimals } from '@/data/mockAnimals';
import type { Animal } from '@/stores/animalStore';

const PAGE_SIZE = 50;

export const useInfiniteAnimals = () => {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<Animal[], Error>({
    queryKey: ['animals', 'farm-wide', 'infinite'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      const { network, supabase } = await networkDiagnostics.runDiagnostics();

      if (!network || !supabase) {
        // Offline or DB issue: return mock data as a single page
        return mockAnimals;
      }

      const animals = await getAnimalsPage(PAGE_SIZE, offset);
      return animals;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) return undefined;
      // If we received a full page, assume there may be more
      return lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined;
    },
    staleTime: 60_000, // cache for 1 min
    gcTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const animals = (query.data?.pages || []).flat();
  const isUsingMock = query.data?.pages?.[0] === mockAnimals;

  const clearAndRefetch = async () => {
    networkDiagnostics.clearCache();
    await queryClient.invalidateQueries({ queryKey: ['animals', 'farm-wide', 'infinite'] });
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
