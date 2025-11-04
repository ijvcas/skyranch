import { ScreenOrientation, OrientationLockType } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';

class OrientationService {
  async lockPortrait(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Screen orientation only available on native platforms');
      return;
    }

    try {
      await ScreenOrientation.lock({ orientation: 'portrait' });
      console.log('📱 Locked to portrait');
    } catch (error) {
      console.error('❌ Error locking portrait:', error);
    }
  }

  async lockLandscape(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await ScreenOrientation.lock({ orientation: 'landscape' });
      console.log('📱 Locked to landscape');
    } catch (error) {
      console.error('❌ Error locking landscape:', error);
    }
  }

  async unlockOrientation(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await ScreenOrientation.unlock();
      console.log('📱 Orientation unlocked');
    } catch (error) {
      console.error('❌ Error unlocking orientation:', error);
    }
  }

  async getCurrentOrientation(): Promise<OrientationLockType | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const result = await ScreenOrientation.orientation();
      return result.type as OrientationLockType;
    } catch (error) {
      console.error('❌ Error getting orientation:', error);
      return null;
    }
  }

  isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const orientationService = new OrientationService();
