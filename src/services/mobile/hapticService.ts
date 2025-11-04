import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

class HapticService {
  private isNative = Capacitor.isNativePlatform();

  /**
   * Check if haptics are available on this device
   */
  isAvailable(): boolean {
    return this.isNative;
  }

  /**
   * Light impact - for UI interactions like button taps
   */
  async light() {
    if (!this.isAvailable()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.warn('Haptic light impact failed:', error);
    }
  }

  /**
   * Medium impact - for standard interactions
   */
  async medium() {
    if (!this.isAvailable()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.warn('Haptic medium impact failed:', error);
    }
  }

  /**
   * Heavy impact - for important actions like delete
   */
  async heavy() {
    if (!this.isAvailable()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.warn('Haptic heavy impact failed:', error);
    }
  }

  /**
   * Success notification - for successful operations
   */
  async success() {
    if (!this.isAvailable()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.warn('Haptic success notification failed:', error);
    }
  }

  /**
   * Warning notification - for warnings
   */
  async warning() {
    if (!this.isAvailable()) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.warn('Haptic warning notification failed:', error);
    }
  }

  /**
   * Error notification - for errors
   */
  async error() {
    if (!this.isAvailable()) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.warn('Haptic error notification failed:', error);
    }
  }

  /**
   * Selection changed - for toggles and selections
   */
  async selection() {
    if (!this.isAvailable()) return;
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (error) {
      console.warn('Haptic selection failed:', error);
    }
  }
}

export const hapticService = new HapticService();
