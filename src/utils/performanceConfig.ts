// Performance configuration constants
export const PERFORMANCE_CONFIG = {
  // Query cache times (in milliseconds)
  CACHE_TIMES: {
    DASHBOARD_STATS: 2 * 60_000, // 2 minutes - frequent updates for dashboard
    ANIMAL_LIST: 3 * 60_000, // 3 minutes - balance between freshness and performance  
    ANIMAL_LEAN: 5 * 60_000, // 5 minutes - longer cache for lean queries
    BREEDING_RECORDS: 5 * 60_000, // 5 minutes - pregnancy data doesn't change often
  },
  
  // Garbage collection times
  GC_TIMES: {
    DEFAULT: 5 * 60_000, // 5 minutes
    EXTENDED: 10 * 60_000, // 10 minutes
    LONG_TERM: 15 * 60_000, // 15 minutes
  },
  
  // Pagination and virtualization
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 50,
    VIRTUAL_THRESHOLD: 50, // Switch to virtual scrolling above this number
    MAX_VISIBLE_ITEMS: 100, // Maximum items to render at once
  },
  
  // Retry configuration
  RETRY: {
    MAX_RETRIES: 2,
    INITIAL_DELAY: 1000,
    MAX_DELAY: 10000,
  },
  
  // Performance monitoring
  MONITORING: {
    ENABLE_PERFORMANCE_MARKS: process.env.NODE_ENV === 'development',
    LOG_SLOW_QUERIES: true,
    SLOW_QUERY_THRESHOLD: 1000, // 1 second
  }
};

// Performance utility functions
export const performanceUtils = {
  // Mark performance points
  mark: (name: string) => {
    if (PERFORMANCE_CONFIG.MONITORING.ENABLE_PERFORMANCE_MARKS) {
      performance.mark(name);
    }
  },
  
  // Measure performance between marks
  measure: (name: string, startMark: string, endMark: string) => {
    if (PERFORMANCE_CONFIG.MONITORING.ENABLE_PERFORMANCE_MARKS) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        if (measure.duration > PERFORMANCE_CONFIG.MONITORING.SLOW_QUERY_THRESHOLD) {
          console.warn(`⚡ Slow operation detected: ${name} took ${measure.duration.toFixed(2)}ms`);
        }
      } catch (error) {
        // Ignore performance measurement errors
      }
    }
  },
  
  // Debounce function for search inputs
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  
  // Throttle function for scroll events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};