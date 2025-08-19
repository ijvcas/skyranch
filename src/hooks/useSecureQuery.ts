import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurity } from './useSecurity';

interface SecureQueryOptions<T> {
  queryKey: unknown[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: number;
  timeout?: number;
}

/**
 * Secure query hook with built-in timeout, retry logic, and security logging
 */
export const useSecureQuery = <T>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 30000,
  gcTime = 300000,
  retry = 2,
  timeout = 15000,
}: SecureQueryOptions<T>) => {
  const { user } = useAuth();
  const { logSecurityEvent } = useSecurity();

  return useQuery({
    queryKey,
    queryFn: async () => {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          const error = new Error(`Query timeout after ${timeout}ms`);
          logSecurityEvent('query_timeout', user?.id, { queryKey, timeout });
          reject(error);
        }, timeout)
      );

      try {
        const result = await Promise.race([queryFn(), timeoutPromise]);
        return result;
      } catch (error) {
        // Log query errors for security monitoring
        logSecurityEvent('query_error', user?.id, { 
          queryKey, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
    },
    enabled: enabled && !!user,
    staleTime,
    gcTime,
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};