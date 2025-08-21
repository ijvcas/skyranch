import { toast } from 'sonner';

/**
 * Service to clear cached data and force fresh loading of shared data
 * This ensures users see the most current shared data after RLS policy changes
 */
export class CacheCleanupService {
  
  /**
   * Clear all cached polygon and lot data to force fresh load of shared data
   */
  static clearAllCaches(): void {
    try {
      // Clear polygon-related localStorage
      localStorage.removeItem('lotPolygons');
      
      // Clear any other lot-related caches
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('lot') || key.includes('polygon') || key.includes('parcel'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('🗑️ Cleared cached lot and polygon data');
      toast.success('Cache cleared - refreshing shared data...');
      
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Error clearing cache');
    }
  }

  /**
   * Force refresh the page to ensure clean state
   */
  static forceRefresh(): void {
    this.clearAllCaches();
    // Small delay to ensure cache clearing completes
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  /**
   * Check if cache needs clearing (e.g., after RLS policy changes)
   */
  static shouldClearCache(): boolean {
    // Check if we need to clear cache after policy changes
    const lastCacheKey = 'skyranch-last-cache-clear';
    const lastClear = localStorage.getItem(lastCacheKey);
    const currentTime = Date.now();
    
    // If no record of cache clear, or it's been more than 1 hour, clear cache
    if (!lastClear || currentTime - parseInt(lastClear) > 60 * 60 * 1000) {
      localStorage.setItem(lastCacheKey, currentTime.toString());
      return true;
    }
    
    return false;
  }
}