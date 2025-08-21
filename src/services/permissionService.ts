
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type Permission = 
  | 'animals_view' | 'animals_edit' | 'animals_delete' | 'animals_create' | 'animals_declare_death'
  | 'lots_manage' | 'health_records' | 'breeding_records' | 'calendar_manage'
  | 'users_manage' | 'system_settings';

export type UserRole = 'admin' | 'manager' | 'worker';

// Permission mappings for each role
// New rule: Everyone can see everything, but only admin can access system settings
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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
    
    if (!user || !user.email) {
      console.log('❌ No current user found');
      return null;
    }
    
    // First try to get user role by ID
    let { data: appUser, error } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    // If that fails, try by email as fallback
    if (error || !appUser) {
      console.log('⚠️ User not found by ID, trying by email:', user.email);
      const { data: userByEmail, error: emailError } = await supabase
        .from('app_users')
        .select('role')
        .eq('email', user.email)
        .maybeSingle();
        
      if (!emailError && userByEmail) {
        appUser = userByEmail;
        error = null;
      }
    }
    
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
  // For basic view permissions, be more lenient to avoid blocking users
  if (permission === 'animals_view' || permission === 'lots_manage' || permission === 'calendar_manage') {
    try {
      const allowed = await hasPermission(permission, authUser);
      if (allowed) {
        return; // Permission granted normally
      }
      
      // For view permissions, if we can't determine role but user is authenticated, allow access
      const user = authUser || (await supabase.auth.getUser()).data.user;
      if (user) {
        console.log(`⚠️ Allowing ${permission} for authenticated user despite role check failure`);
        return;
      }
    } catch (error) {
      console.error('❌ Permission check failed:', error);
      // For view permissions, don't block if there's an error
      const user = authUser || (await supabase.auth.getUser()).data.user;
      if (user && (permission === 'animals_view' || permission === 'lots_manage' || permission === 'calendar_manage')) {
        console.log(`⚠️ Allowing ${permission} due to permission check error for authenticated user`);
        return;
      }
    }
  }
  
  // For other permissions, use strict checking
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
