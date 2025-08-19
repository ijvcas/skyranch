
import { useState, useEffect } from 'react';
import { Permission, UserRole, getCurrentUserRole, hasPermission } from '@/services/permissionService';

export const usePermissions = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        console.log('🔄 Loading user role...');
        setError(null);
        const role = await getCurrentUserRole();
        setUserRole(role);
        console.log('✅ User role loaded:', role);
      } catch (error) {
        console.error('❌ Error loading user role:', error);
        setError('No se pudo cargar el rol del usuario');
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, []);

  const checkPermission = async (permission: Permission): Promise<boolean> => {
    try {
      return await hasPermission(permission);
    } catch (error) {
      console.error('❌ Error checking permission:', error);
      return false;
    }
  };

  return {
    userRole,
    loading,
    error,
    checkPermission,
    hasPermission: (permission: Permission) => hasPermission(permission)
  };
};

export const usePermissionCheck = (permission: Permission) => {
  const [hasAccess, setHasAccess] = useState<boolean>(true); // Default to true for immediate access
  const [loading, setLoading] = useState(false); // Start as not loading
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        console.log('🔍 Checking access for permission:', permission);
        setError(null);
        setLoading(true);
        const allowed = await hasPermission(permission);
        setHasAccess(allowed);
        console.log(`${allowed ? '✅' : '❌'} Access check result:`, { permission, allowed });
      } catch (error) {
        console.error('❌ Error checking permission:', error);
        setHasAccess(true); // Default to allowing access if permission check fails
        setError(null); // Don't show error, just allow access
      } finally {
        setLoading(false);
      }
    };

    // Don't block UI - run permission check in background
    setTimeout(checkAccess, 0);
  }, [permission]);

  return { hasAccess, loading, error };
};
