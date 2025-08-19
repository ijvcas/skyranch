
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Permission, UserRole } from '@/services/permissionService';

// Simplified role-based permissions to avoid async database calls
const ROLE_PERMISSIONS: Record<UserRole | 'none', Permission[]> = {
  admin: [
    'animals_view', 'animals_edit', 'animals_delete', 'animals_create', 'animals_declare_death',
    'lots_manage', 'health_records', 'breeding_records', 'calendar_manage',
    'users_manage', 'system_settings'
  ],
  manager: [
    'animals_view', 'animals_edit', 'animals_delete', 'animals_create', 'animals_declare_death',
    'lots_manage', 'health_records', 'breeding_records', 'calendar_manage',
    'users_manage'
  ],
  worker: [
    'animals_view', 'animals_edit', 'animals_delete', 'animals_create',
    'lots_manage', 'health_records', 'breeding_records', 'calendar_manage'
  ],
  none: ['animals_view'] // Basic view access for unauthenticated users
};

export const usePermissions = () => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    // Get role from user metadata or default to worker
    const role = (user.user_metadata?.role || 'worker') as UserRole;
    setUserRole(role);
    setLoading(false);
    console.log('✅ User role set from metadata:', role);
  }, [user, authLoading]);

  const checkPermission = (permission: Permission): boolean => {
    if (!userRole) return false;
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  };

  return {
    userRole,
    loading,
    error,
    checkPermission,
    hasPermission: checkPermission // Sync version
  };
};

export const usePermissionCheck = (permission: Permission) => {
  const { checkPermission, loading: permLoading } = usePermissions();
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permLoading) return;
    
    const allowed = checkPermission(permission);
    setHasAccess(allowed);
    setLoading(false);
    console.log(`${allowed ? '✅' : '❌'} Permission check result:`, { permission, allowed });
  }, [permission, checkPermission, permLoading]);

  return { hasAccess, loading, error };
};
