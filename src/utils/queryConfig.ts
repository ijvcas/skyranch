// Optimized React Query configuration
import { QueryClient } from '@tanstack/react-query';

export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Reduce stale time to prevent multiple identical requests
        staleTime: 60_000, // 1 minute
        gcTime: 5 * 60_000, // 5 minutes
        
        // Prevent multiple identical requests
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        
        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry auth errors
          if (error?.message?.includes('auth') || error?.message?.includes('JWT')) {
            return false;
          }
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Performance monitoring utilities
export const queryPerformanceMonitor = {
  startTime: new Map<string, number>(),
  
  markQueryStart: (queryKey: string) => {
    queryPerformanceMonitor.startTime.set(queryKey, performance.now());
  },
  
  markQueryEnd: (queryKey: string) => {
    const start = queryPerformanceMonitor.startTime.get(queryKey);
    if (start) {
      const duration = performance.now() - start;
      if (duration > 1000) { // Log queries taking more than 1 second
        console.warn(`⚡ Slow query detected: ${queryKey} took ${duration.toFixed(2)}ms`);
      } else {
        console.log(`⚡ Query completed: ${queryKey} took ${duration.toFixed(2)}ms`);
      }
      queryPerformanceMonitor.startTime.delete(queryKey);
    }
  }
};
