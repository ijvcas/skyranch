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
    queryFn: async () => {
      console.log('🚀 Starting breeding recommendations query...');
      try {
        const recommendations = await OptimizedBreedingRecommendationGenerator.generateBreedingRecommendations(effectiveDepth);
        console.log(`✅ Query completed with ${recommendations.length} recommendations`);
        return recommendations;
      } catch (error: any) {
        console.error('❌ Query failed:', error);
        
        // Handle authentication errors gracefully
        if (error?.code === 'refresh_token_not_found' || error?.message?.includes('Invalid Refresh Token')) {
          console.log('🔐 Authentication required for breeding recommendations');
          return [];
        }
        
        throw error;
      }
    },
    enabled,
    staleTime: isMobile ? 5 * 60 * 1000 : 30 * 60 * 1000, // 5 min mobile, 30 min desktop
    gcTime: isMobile ? 15 * 60 * 1000 : 60 * 60 * 1000, // 15 min mobile, 1 hour desktop
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      // Don't retry auth errors
      if (error?.code === 'refresh_token_not_found' || error?.message?.includes('Invalid Refresh Token')) {
        console.log('🔐 Skipping retry for authentication error');
        return false;
      }
      
      console.log(`🔄 Retry attempt ${failureCount} for breeding recommendations`);
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      errorMessage: 'Failed to load breeding recommendations'
    }
  });
}

// Hook for clearing cache when data changes
export function useClearBreedingCache() {
  return () => {
    console.log('🗑️ Clearing breeding recommendations cache');
    OptimizedBreedingRecommendationGenerator.clearCache();
  };
}