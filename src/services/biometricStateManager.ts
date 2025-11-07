import { BiometricService } from './biometricService';

/**
 * Singleton manager for biometric state to prevent multiple simultaneous checks
 * and provide a centralized source of truth
 */
class BiometricStateManager {
  private isAvailable: boolean = false;
  private biometricType: string = 'none';
  private isEnabled: boolean = false;
  private isChecking: boolean = false;
  private lastCheckTime: number = 0;
  private readonly CACHE_DURATION_MS = 3000; // Cache for 3 seconds
  private listeners: Set<() => void> = new Set();

  /**
   * Check biometric status with caching and debouncing
   */
  async checkStatus(): Promise<void> {
    const now = Date.now();
    
    // If we checked within the last 3 seconds, use cached values
    if (now - this.lastCheckTime < this.CACHE_DURATION_MS) {
      console.log('🔄 [BiometricStateManager] Using cached status');
      return;
    }

    // If a check is already in progress, wait for it
    if (this.isChecking) {
      console.log('🔄 [BiometricStateManager] Check already in progress, skipping');
      return;
    }

    this.isChecking = true;
    console.log('🔄 [BiometricStateManager] Checking biometric status...');

    try {
      this.isAvailable = await BiometricService.isAvailable();

      if (this.isAvailable) {
        this.biometricType = await BiometricService.getBiometricType();
        this.isEnabled = await BiometricService.isEnabled();
      } else {
        this.biometricType = 'none';
        this.isEnabled = false;
      }

      this.lastCheckTime = now;
      console.log('✅ [BiometricStateManager] Status updated:', {
        isAvailable: this.isAvailable,
        biometricType: this.biometricType,
        isEnabled: this.isEnabled
      });

      // Notify all listeners
      this.notifyListeners();
    } catch (error) {
      console.error('❌ [BiometricStateManager] Status check failed:', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Get current status (from cache)
   */
  getStatus() {
    return {
      isAvailable: this.isAvailable,
      biometricType: this.biometricType,
      isEnabled: this.isEnabled,
      loading: this.isChecking
    };
  }

  /**
   * Force refresh status (bypass cache)
   */
  async forceRefresh(): Promise<void> {
    this.lastCheckTime = 0;
    await this.checkStatus();
  }

  /**
   * Subscribe to status changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all subscribers
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Clear cache (useful after enabling/disabling biometric)
   */
  clearCache(): void {
    this.lastCheckTime = 0;
  }
}

export const biometricStateManager = new BiometricStateManager();
