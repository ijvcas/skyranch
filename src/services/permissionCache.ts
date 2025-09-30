// Permission caching service to reduce database calls
// Caches user roles and permissions with TTL to prevent repeated DB queries

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PermissionCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  clearKey(key: string): void {
    this.cache.delete(key);
  }

  // Clear all auth-related caches
  clearAuthCache(): void {
    const authKeys = Array.from(this.cache.keys()).filter(
      key => key.startsWith('role:') || key.startsWith('permission:')
    );
    authKeys.forEach(key => this.cache.delete(key));
  }
}

export const permissionCache = new PermissionCache();

// Helper functions for common cache patterns
export const getCachedUserRole = (userId: string) => 
  permissionCache.get<string>(`role:${userId}`);

export const setCachedUserRole = (userId: string, role: string) => 
  permissionCache.set(`role:${userId}`, role, 5 * 60 * 1000); // 5 min TTL

export const getCachedPermission = (userId: string, permission: string) => 
  permissionCache.get<boolean>(`permission:${userId}:${permission}`);

export const setCachedPermission = (userId: string, permission: string, hasAccess: boolean) => 
  permissionCache.set(`permission:${userId}:${permission}`, hasAccess, 5 * 60 * 1000);
