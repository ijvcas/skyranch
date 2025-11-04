import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

class LocationService {
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    if (!Capacitor.isNativePlatform()) {
      console.log('📍 Geolocation only available on native platforms');
      return null;
    }

    try {
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      const coordinates: LocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString()
      };

      console.log('📍 Location obtained:', coordinates);
      return coordinates;
    } catch (error) {
      console.error('❌ Error getting location:', error);
      return null;
    }
  }

  async checkPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      return { location: 'granted', coarseLocation: 'granted' };
    }

    return await Geolocation.checkPermissions();
  }

  async requestPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      return { location: 'granted', coarseLocation: 'granted' };
    }

    return await Geolocation.requestPermissions();
  }

  formatLocationForDisplay(lat: number, lng: number): string {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  openInMaps(lat: number, lng: number): void {
    const url = `https://maps.apple.com/?ll=${lat},${lng}`;
    window.open(url, '_blank');
  }

  isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const locationService = new LocationService();
