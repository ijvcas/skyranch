import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

class CameraService {
  async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true; // Browser will handle permissions
    }

    const permissions = await Camera.checkPermissions();
    return permissions.camera === 'granted' && permissions.photos === 'granted';
  }

  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    const permissions = await Camera.requestPermissions();
    return permissions.camera === 'granted' && permissions.photos === 'granted';
  }

  async takePicture(): Promise<string | null> {
    try {
      // Check and request permissions
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.log('❌ Camera permission denied');
          return null;
        }
      }

      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1920,
        height: 1920,
      });

      return photo.dataUrl || null;
    } catch (error) {
      console.error('❌ Error taking picture:', error);
      return null;
    }
  }

  async selectFromGallery(): Promise<string | null> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.log('❌ Gallery permission denied');
          return null;
        }
      }

      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 1920,
        height: 1920,
      });

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
