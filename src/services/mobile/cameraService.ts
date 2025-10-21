import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

class CameraService {
  async checkPermissions(): Promise<boolean> {
    console.log('📸 Checking camera permissions...');
    if (!Capacitor.isNativePlatform()) {
      console.log('📸 Running in browser - permissions will be handled by browser');
      return true; // Browser will handle permissions
    }

    const permissions = await Camera.checkPermissions();
    console.log('📸 Permission status:', permissions);
    return permissions.camera === 'granted' && permissions.photos === 'granted';
  }

  async requestPermissions(): Promise<boolean> {
    console.log('📸 Requesting camera permissions...');
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    const permissions = await Camera.requestPermissions();
    console.log('📸 Permission request result:', permissions);
    return permissions.camera === 'granted' && permissions.photos === 'granted';
  }

  async takePicture(): Promise<string | null> {
    try {
      console.log('📸 takePicture() called');
      // Check and request permissions
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.log('📸 No permission, requesting...');
        const granted = await this.requestPermissions();
        if (!granted) {
          console.log('❌ Camera permission denied by user');
          return null;
        }
      }

      console.log('📸 Opening camera...');
      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1920,
        height: 1920,
      });

      console.log('✅ Photo captured successfully');
      return photo.dataUrl || null;
    } catch (error) {
      console.error('❌ Error taking picture:', error);
      return null;
    }
  }

  async selectFromGallery(): Promise<string | null> {
    try {
      console.log('📸 selectFromGallery() called');
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.log('📸 No permission, requesting...');
        const granted = await this.requestPermissions();
        if (!granted) {
          console.log('❌ Gallery permission denied by user');
          return null;
        }
      }

      console.log('📸 Opening gallery...');
      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 1920,
        height: 1920,
      });

      console.log('✅ Photo selected successfully');
      return photo.dataUrl || null;
    } catch (error) {
      console.error('❌ Error selecting from gallery:', error);
      return null;
    }
  }

  isAvailable(): boolean {
    return Capacitor.isNativePlatform() || ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices);
  }

  isMobile(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const cameraService = new CameraService();
