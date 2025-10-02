
import React from 'react';
import { Permission } from '@/services/permissionService';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface PermissionGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

/**
 * Optimized PermissionGuard - Zero database calls
 * Reads permissions from AuthContext (loaded once at login)
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback,
  showError = true
}) => {
  const { hasPermission, loading } = useAuthPermissions();

  // Still loading auth state
  if (loading) {
    return null;
  }

  // Check permission instantly (no database call)
  if (!hasPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            No tienes permisos para acceder a esta funcionalidad.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
};

export default PermissionGuard;
