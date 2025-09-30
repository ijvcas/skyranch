// Comprehensive performance monitoring utility
// Tracks query performance, component render times, and provides diagnostics

export interface PerformanceMetrics {
  queryTimes: Map<string, number[]>;
  averageQueryTime: (queryKey: string) => number | null;
  slowQueries: () => Array<{ key: string; avgTime: number }>;
  clearMetrics: () => void;
}

class PerformanceMonitor {
  private queryTimes: Map<string, number[]> = new Map();
  private slowQueryThreshold = 1000; // 1 second

  markQueryStart(queryKey: string): void {
    performance.mark(`${queryKey}-start`);
  }

  markQueryEnd(queryKey: string): void {
    const startMark = `${queryKey}-start`;
    const endMark = `${queryKey}-end`;
    
    try {
      performance.mark(endMark);
      performance.measure(queryKey, startMark, endMark);
      
      const measure = performance.getEntriesByName(queryKey)[0];
      if (measure) {
        this.recordQueryTime(queryKey, measure.duration);
        
        // Log slow queries
        if (measure.duration > this.slowQueryThreshold) {
          console.warn(
            `⚠️ Slow query detected: ${queryKey} took ${measure.duration.toFixed(2)}ms`
          );
        } else {
          console.log(
            `✅ Query completed: ${queryKey} took ${measure.duration.toFixed(2)}ms`
          );
        }
      }
      
      // Cleanup
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(queryKey);
    } catch (error) {
      // Silently fail if performance API not available
    }
  }

  private recordQueryTime(queryKey: string, duration: number): void {
    const times = this.queryTimes.get(queryKey) || [];
    times.push(duration);
    
    // Keep only last 10 measurements
    if (times.length > 10) {
      times.shift();
    }
    
    this.queryTimes.set(queryKey, times);
  }

  getAverageQueryTime(queryKey: string): number | null {
    const times = this.queryTimes.get(queryKey);
    if (!times || times.length === 0) return null;
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }

  getSlowQueries(): Array<{ key: string; avgTime: number }> {
    const slowQueries: Array<{ key: string; avgTime: number }> = [];
    
    this.queryTimes.forEach((times, key) => {
      const avg = times.reduce((acc, time) => acc + time, 0) / times.length;
      if (avg > this.slowQueryThreshold) {
        slowQueries.push({ key, avgTime: avg });
      }
    });
    
    return slowQueries.sort((a, b) => b.avgTime - a.avgTime);
  }

  clearMetrics(): void {
    this.queryTimes.clear();
  }

  getMetricsSummary(): {
    totalQueries: number;
    averageTime: number;
    slowQueries: number;
  } {
    let totalTime = 0;
    let totalCount = 0;
    let slowCount = 0;
    
    this.queryTimes.forEach((times) => {
      times.forEach((time) => {
        totalTime += time;
        totalCount++;
        if (time > this.slowQueryThreshold) slowCount++;
      });
    });
    
    return {
      totalQueries: totalCount,
      averageTime: totalCount > 0 ? totalTime / totalCount : 0,
      slowQueries: slowCount
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Export convenience functions
export const markQueryStart = (queryKey: string) => 
  performanceMonitor.markQueryStart(queryKey);

export const markQueryEnd = (queryKey: string) => 
  performanceMonitor.markQueryEnd(queryKey);

export const getMetricsSummary = () => 
  performanceMonitor.getMetricsSummary();
