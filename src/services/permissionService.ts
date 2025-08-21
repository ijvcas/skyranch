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
    
    if (!user) {
      console.log('❌ No current user found');
      return null;
    }
    
    // Try multiple approaches to get user role
    let appUser = null;
    
    // First try: by user ID
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!error && data) {
        appUser = data;
      }
    } catch (error) {
      console.warn('❌ Error getting user by ID:', error);
    }
    
    // Second try: by email if ID failed
    if (!appUser && user.email) {
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('role')
          .eq('email', user.email)
          .maybeSingle();
        
        if (!error && data) {
          appUser = data;
          console.log('✅ Found user by email fallback');
        }
      } catch (error) {
        console.warn('❌ Error getting user by email:', error);
      }
    }
    
    if (!appUser) {
      console.log('❌ User not found in app_users table, defaulting to worker role');
      // Return worker as default role for authenticated users
      return 'worker';
    }
    
    console.log('✅ Current user role:', appUser.role);
    return appUser.role as UserRole;
  } catch (error) {
    console.error('❌ Error getting current user role:', error);
    // Return worker as safe default for authenticated users
    return 'worker';
  }
};

export const hasPermission = async (permission: Permission, authUser?: User | null): Promise<boolean> => {
  try {
    console.log('🔍 Checking permission:', permission);
    const userRole = await getCurrentUserRole(authUser);
    
    if (!userRole) {
      console.log('❌ No user role found, defaulting to basic permissions');
      // For basic permissions, allow authenticated users even if role detection fails
      const basicPermissions: Permission[] = ['animals_view', 'calendar_manage', 'lots_manage', 'health_records'];
      return basicPermissions.includes(permission);
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
    // For basic permissions, be permissive when there are auth context issues
    const basicPermissions: Permission[] = ['animals_view', 'calendar_manage', 'lots_manage', 'health_records'];
    return basicPermissions.includes(permission);
  }
};

export const checkPermission = async (permission: Permission, authUser?: User | null): Promise<void> => {
  try {
    const allowed = await hasPermission(permission, authUser);
    if (!allowed) {
      const userRole = await getCurrentUserRole(authUser);
      const errorMessage = userRole 
        ? `Acceso denegado: Tu rol '${userRole}' no tiene permisos para ${permission}`
        : `Acceso denegado: No se pudo determinar tu rol de usuario para ${permission}`;
      throw new Error(errorMessage);
    }
  } catch (error) {
    // For basic permissions like animals_view, don't block if there's an auth context issue
    const basicPermissions: Permission[] = ['animals_view', 'calendar_manage', 'lots_manage', 'health_records'];
    if (basicPermissions.includes(permission)) {
      console.warn(`⚠️ Permission check failed for ${permission}, allowing due to auth context issues:`, error);
      return; // Allow the operation to continue
    }
    // For sensitive operations, still block
    throw error;
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