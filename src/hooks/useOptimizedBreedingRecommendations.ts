import { useQuery } from '@tanstack/react-query';
import { OptimizedBreedingRecommendationGenerator } from '@/services/pedigree/optimizedBreedingRecommendationGenerator';
import { useIsMobile } from '@/hooks/use-mobile';
import type { BreedingRecommendation } from '@/services/pedigree/types';

interface UseBreedingRecommendationsOptions {
  enabled?: boolean;
  maxDepth?: number;
}

export function useOptimizedBreedingRecommendations(options: UseBreedingRecommendationsOptions = {}) {
  const isMobile = useIsMobile();
  const { enabled = true, maxDepth } = options;
  
  // Use reduced depth on mobile for better performance
  const effectiveDepth = maxDepth ?? (isMobile ? 2 : 4);
  
  return useQuery<BreedingRecommendation[]>({
    queryKey: ['breeding-recommendations', effectiveDepth, isMobile],
    queryFn: () => OptimizedBreedingRecommendationGenerator.generateBreedingRecommendations(effectiveDepth),
    enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (renamed from cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook for clearing cache when data changes
export function useClearBreedingCache() {
  return () => {
    OptimizedBreedingRecommendationGenerator.clearCache();
  };
}