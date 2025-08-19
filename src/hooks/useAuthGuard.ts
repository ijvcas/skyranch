import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Authentication guard hook that prevents data fetching until user is authenticated
 */
export const useAuthGuard = () => {
  const { user, loading } = useAuth();
  
  const isReady = !loading && !!user;
  const shouldWait = loading || !user;
  
  return {
    isReady,
    shouldWait,
    user,
    loading
  };
};