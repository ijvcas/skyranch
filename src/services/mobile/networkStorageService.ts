/**
 * Network and Storage Detection Service
 * Detects network conditions and device storage availability
 */

export type NetworkSpeed = 'fast' | 'moderate' | 'slow' | 'offline';
export type StorageLevel = 'high' | 'moderate' | 'low' | 'critical';

export interface DeviceConditions {
  networkSpeed: NetworkSpeed;
  storageLevel: StorageLevel;
  availableStorageMB: number;
  isOnline: boolean;
  connectionType?: string;
}

class NetworkStorageService {
  private cachedConditions: DeviceConditions | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION_MS = 30000; // 30 seconds

  /**
   * Get current device conditions (network + storage)
   * Results are cached for 30 seconds to avoid excessive checks
   */
  async getDeviceConditions(): Promise<DeviceConditions> {
    const now = Date.now();
    
    // Return cached result if still valid
    if (this.cachedConditions && (now - this.cacheTimestamp) < this.CACHE_DURATION_MS) {
      return this.cachedConditions;
    }

    // Fetch fresh conditions
    const [networkSpeed, storageLevel, availableStorageMB] = await Promise.all([
      this.detectNetworkSpeed(),
      this.detectStorageLevel(),
      this.getAvailableStorageMB()
    ]);

    const conditions: DeviceConditions = {
      networkSpeed,
      storageLevel,
      availableStorageMB,
      isOnline: navigator.onLine,
      connectionType: this.getConnectionType()
    };

    // Cache the result
    this.cachedConditions = conditions;
    this.cacheTimestamp = now;

    return conditions;
  }

  /**
   * Detect network speed using NetworkInformation API and fallbacks
   */
  private async detectNetworkSpeed(): Promise<NetworkSpeed> {
    if (!navigator.onLine) {
      return 'offline';
    }

    // Try NetworkInformation API (available in Chrome/Edge)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      
      // Map effective types to our speed categories
      if (effectiveType === '4g') return 'fast';
      if (effectiveType === '3g') return 'moderate';
      if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'slow';
      
      // Check downlink speed (Mbps)
      if (connection.downlink) {
        if (connection.downlink >= 5) return 'fast';
        if (connection.downlink >= 1.5) return 'moderate';
        return 'slow';
      }
    }

    // Fallback: Estimate based on connection type
    if (this.isWiFi()) {
      return 'fast';
    }

    // Default to moderate for cellular
    return 'moderate';
  }

  /**
   * Detect storage availability level
   */
  private async detectStorageLevel(): Promise<StorageLevel> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const availableMB = this.bytesToMB(estimate.quota || 0) - this.bytesToMB(estimate.usage || 0);
        
        if (availableMB > 500) return 'high';
        if (availableMB > 200) return 'moderate';
        if (availableMB > 50) return 'low';
        return 'critical';
      }
    } catch (error) {
      console.warn('Could not estimate storage:', error);
    }

    // Default to moderate if API unavailable
    return 'moderate';
  }

  /**
   * Get available storage in MB
   */
  private async getAvailableStorageMB(): Promise<number> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return this.bytesToMB(estimate.quota || 0) - this.bytesToMB(estimate.usage || 0);
      }
    } catch (error) {
      console.warn('Could not get storage info:', error);
    }
    return 1000; // Assume 1GB available if unknown
  }

  /**
   * Get human-readable connection type
   */
  private getConnectionType(): string | undefined {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || connection?.type;
  }

  /**
   * Check if connected via WiFi
   */
  private isWiFi(): boolean {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.type === 'wifi';
  }

  /**
   * Convert bytes to megabytes
   */
  private bytesToMB(bytes: number): number {
    return bytes / (1024 * 1024);
  }

  /**
   * Clear cached conditions (useful for testing)
   */
  clearCache(): void {
    this.cachedConditions = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get human-readable description of conditions
   */
  getConditionsDescription(conditions: DeviceConditions): string {
    const networkEmoji = {
      fast: '📶',
      moderate: '📱',
      slow: '🐌',
      offline: '❌'
    }[conditions.networkSpeed];

    const storageEmoji = {
      high: '💾',
      moderate: '💾',
      low: '⚠️',
      critical: '🚨'
    }[conditions.storageLevel];

    const networkText = {
      fast: conditions.connectionType === 'wifi' ? 'WiFi' : '4G',
      moderate: '3G',
      slow: '2G',
      offline: 'Sin conexión'
    }[conditions.networkSpeed];

    const storageText = `${Math.round(conditions.availableStorageMB)}MB`;

    return `${networkEmoji} ${networkText} ${storageEmoji} ${storageText}`;
  }
}

export const networkStorageService = new NetworkStorageService();
