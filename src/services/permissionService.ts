/**
 * Permission Service
 * 
 * SECURITY NOTE: Client-side permission management for UI/UX
 * 
 * ⚠️ IMPORTANT: This service is for USER INTERFACE control ONLY
 * - Determines what buttons/links/pages to show users
 * - Provides convenient permission checking for components
 * - Caches role/permission data to avoid repeated database queries
 * 
 * 🔒 SECURITY ENFORCEMENT is at the server level:
 * - Row Level Security (RLS) policies on all database tables
 * - Edge functions verify user authentication and roles independently
 * - Database functions use SECURITY DEFINER with proper scoping
 * 
 * Client-side checks CANNOT be trusted for security because:
 * - JavaScript can be modified in browser DevTools
 * - localStorage can be manually edited
 * - API calls can be crafted outside the UI
 * 
 * Even if an attacker bypasses these client checks, the database RLS policies
 * will block unauthorized operations at the data layer.
 */

import { supabase } from '@/integrations/supabase/client';
import { getCachedUserRole, setCachedUserRole, getCachedPermission, setCachedPermission } from './permissionCache';
import type { User } from '@supabase/supabase-js';

export type Permission =
  | 'animals_view' | 'animals_edit' | 'animals_delete' | 'animals_create' | 'animals_declare_death' | 'animals_declare_sale'
  | 'lots_manage' | 'health_records' | 'breeding_records' | 'calendar_manage'
  | 'cadastral_view' | 'cadastral_edit' | 'cadastral_create' | 'cadastral_delete'
  | 'users_manage' | 'system_settings';

export type UserRole = 'admin' | 'manager' | 'worker';

// Permission mappings for each role
// New rule: Everyone can see everything, but only admin can access system settings
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'animals_view', 'animals_edit', 'animals_delete', 'animals_create', 'animals_declare_death', 'animals_declare_sale',
    'lots_manage', 'health_records', 'breeding_records', 'calendar_manage',
    'cadastral_view', 'cadastral_edit', 'cadastral_create', 'cadastral_delete',
    'users_manage', 'system_settings'
  ],
  manager: [
    'animals_view', 'animals_edit', 'animals_delete', 'animals_create', 'animals_declare_death', 'animals_declare_sale',
    'lots_manage', 'health_records', 'breeding_records', 'calendar_manage',
    'cadastral_view', 'cadastral_edit',
    'users_manage'
  ],
  worker: [
    'animals_view', 'animals_edit', 'animals_delete', 'animals_create',
    'lots_manage', 'health_records', 'breeding_records', 'calendar_manage',
    'cadastral_view'
  ]
};

export const getCurrentUserRole = async (authUser?: User | null): Promise<UserRole | null> => {
  try {
    // If authUser is provided, use it; otherwise try to get from auth
    let user = authUser;
    if (!user) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user = currentUser;
    }
    
    if (!user) {
      return null;
    }

    // Check cache first
    const cachedRole = getCachedUserRole(user.id);
    if (cachedRole) {
      return cachedRole as UserRole;
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
      // Silent error handling
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
        }
      } catch (error) {
        // Silent error handling
      }
    }
    
    if (!appUser) {
      // Cache the default role
      if (user) setCachedUserRole(user.id, 'worker');
      return 'worker';
    }
    
    const role = appUser.role as UserRole;
    
    // Cache the role
    if (user) setCachedUserRole(user.id, role);
    
    return role;
  } catch (error) {
    console.error('❌ Error getting current user role:', error);
    // Return worker as safe default for authenticated users
    return 'worker';
  }
};

export const hasPermission = async (permission: Permission, authUser?: User | null): Promise<boolean> => {
  try {
    // Get user for cache key
    let user = authUser;
    if (!user) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user = currentUser;
    }
    
    // Check cache first
    if (user) {
      const cachedPermission = getCachedPermission(user.id, permission);
      if (cachedPermission !== null) {
        return cachedPermission;
      }
    }
    
    const userRole = await getCurrentUserRole(authUser);
    
    if (!userRole) {
      // For basic permissions, allow authenticated users even if role detection fails
      const basicPermissions: Permission[] = ['animals_view', 'calendar_manage', 'lots_manage', 'health_records', 'cadastral_view'];
      return basicPermissions.includes(permission);
    }
    
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    const hasAccess = rolePermissions.includes(permission);
    
    // Cache the result
    if (user) {
      setCachedPermission(user.id, permission, hasAccess);
    }
    
    return hasAccess;
  } catch (error) {
    // For basic permissions, be permissive when there are auth context issues
    const basicPermissions: Permission[] = ['animals_view', 'calendar_manage', 'lots_manage', 'health_records', 'cadastral_view'];
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
    const basicPermissions: Permission[] = ['animals_view', 'calendar_manage', 'lots_manage', 'health_records', 'cadastral_view'];
    if (basicPermissions.includes(permission)) {
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