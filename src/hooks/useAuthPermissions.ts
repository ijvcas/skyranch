import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/services/permissionService';

/**
 * Optimized permission hook that reads from AuthContext
 * Zero database calls - permissions loaded once at login
 */
export const useAuthPermissions = () => {
  const { userRole, permissions, loading } = useAuth();
  
  const hasPermission = (permission: Permission): boolean => {
    if (loading || !userRole || !permissions) return false;
    return permissions.includes(permission);
  };
  
  return { 
    userRole, 
    permissions,
    hasPermission, 
    loading 
  };
};
