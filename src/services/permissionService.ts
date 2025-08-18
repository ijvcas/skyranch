
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type Permission = 
  | 'animals_view' | 'animals_edit' | 'animals_delete' | 'animals_create'
  | 'lots_manage' | 'health_records' | 'breeding_records' | 'calendar_manage'
  | 'users_manage' | 'system_settings';

export type UserRole = 'admin' | 'manager' | 'worker';

// Permission mappings for each role
// New rule: Everyone can see everything, but only admin can access system settings
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'animals_view', 'animals_edit', 'animals_delete', 'animals_create',
    'lots_manage', 'health_records', 'breeding_records', 'calendar_manage',
    'users_manage', 'system_settings'
  ],
  manager: [
    'animals_view', 'animals_edit', 'animals_delete', 'animals_create',
    'lots_manage', 'health_records', 'breeding_records', 'calendar_manage',
    'users_manage'
  ],
  worker: [
    'animals_view', 'animals_edit', 'animals_delete', 'animals_create',
    'lots_manage', 'health_records', 'breeding_records', 'calendar_manage'
  ]
};

export const getCurrentUserRole = async (authUser?: User | null): Promise<UserRole | null> => {
  try {
    console.log('🔍 Getting current user role...');
    
    // If authUser is provided, use it; otherwise try to get from auth
    let user = authUser;
    if (!user) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user = currentUser;
    }
    
    if (!user) {
      console.log('❌ No current user found');
      return null;
    }
    
    // Get user role from app_users table
    const { data: appUser, error } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Error getting user role:', error);
      return null;
    }
    
    if (!appUser) {
      console.log('❌ User not found in app_users table');
      return null;
    }
    
    console.log('✅ Current user role:', appUser.role);
    return appUser.role as UserRole;
  } catch (error) {
    console.error('❌ Error getting current user role:', error);
    return null;
  }
};

export const hasPermission = async (permission: Permission, authUser?: User | null): Promise<boolean> => {
  try {
    console.log('🔍 Checking permission:', permission);
    const userRole = await getCurrentUserRole(authUser);
    
    if (!userRole) {
      console.log('❌ No user role found, defaulting to no permission');
      return false;
    }
    
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    const hasAccess = rolePermissions.includes(permission);
    
    console.log(`${hasAccess ? '✅' : '❌'} Permission check result:`, {
      permission,
      userRole,
      hasAccess
    });
    
    return hasAccess;
  } catch (error) {
    console.error('❌ Error checking permission:', error);
    return false;
  }
};

export const checkPermission = async (permission: Permission, authUser?: User | null): Promise<void> => {
  const allowed = await hasPermission(permission, authUser);
  if (!allowed) {
    const userRole = await getCurrentUserRole(authUser);
    const errorMessage = userRole 
      ? `Acceso denegado: Tu rol '${userRole}' no tiene permisos para ${permission}`
      : `Acceso denegado: No se pudo determinar tu rol de usuario para ${permission}`;
    throw new Error(errorMessage);
  }
};

export const requirePermission = (permission: Permission) => {
  return async (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      await checkPermission(permission);
      return method.apply(this, args);
    };
  };
};
