import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

interface StoredCredentials {
  email: string;
  password: string;
}

const CREDENTIALS_KEY = 'farmika_biometric_credentials';

export class BiometricService {
  /**
   * Check if biometric authentication is available on this device
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // Check if we're on a native platform or modern web browser
      if (!Capacitor.isNativePlatform()) {
        // Check for Web Authentication API (WebAuthn) support
        return !!(window.PublicKeyCredential);
      }

      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  /**
   * Get the type of biometric authentication available
   */
  static async getBiometricType(): Promise<string> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return 'webauthn';
      }

      const result = await NativeBiometric.isAvailable();
      
      if (!result.isAvailable) {
        return 'none';
      }

      switch (result.biometryType) {
        case BiometryType.FACE_ID:
          return 'faceId';
        case BiometryType.TOUCH_ID:
          return 'touchId';
        case BiometryType.FINGERPRINT:
          return 'fingerprint';
        case BiometryType.FACE_AUTHENTICATION:
          return 'faceAuth';
        case BiometryType.IRIS_AUTHENTICATION:
          return 'irisAuth';
        default:
          return 'biometric';
      }
    } catch (error) {
      console.error('Failed to get biometric type:', error);
      return 'none';
    }
  }

  /**
   * Get user-friendly name for biometric type
   */
  static getBiometricTypeName(type: string): string {
    switch (type) {
      case 'faceId':
        return 'Face ID';
      case 'touchId':
        return 'Touch ID';
      case 'fingerprint':
        return 'Huella Digital';
      case 'faceAuth':
        return 'Reconocimiento Facial';
      case 'irisAuth':
        return 'Reconocimiento de Iris';
      case 'webauthn':
        return 'Autenticación Biométrica';
      default:
        return 'Biométrico';
    }
  }

  /**
   * Authenticate user with biometrics
   */
  static async authenticate(reason: string = 'Iniciar sesión en FARMIKA'): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        // For web, we'll just return true as credentials are stored separately
        return true;
      }

      console.log('🔐 [BiometricService] Starting authentication...');

      // Add timeout protection to prevent freezing
      const authPromise = NativeBiometric.verifyIdentity({
        reason,
        title: 'Autenticación',
        subtitle: 'FARMIKA',
        description: reason,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout')), 10000);
      });

      await Promise.race([authPromise, timeoutPromise]);
      console.log('✅ [BiometricService] Authentication successful');

      return true;
    } catch (error: any) {
      // User cancelled or authentication failed
      if (error.code === 10 || error.code === 13) {
        // User cancelled
        console.log('❌ [BiometricService] User cancelled biometric authentication');
      } else if (error.message === 'Authentication timeout') {
        console.error('❌ [BiometricService] Authentication timeout');
      } else {
        console.error('❌ [BiometricService] Biometric authentication failed:', error);
      }
      return false;
    }
  }

  /**
   * Save credentials securely
   */
  static async saveCredentials(email: string, password: string): Promise<void> {
    try {
      console.log('💾 [BiometricService] Saving credentials to storage...');
      console.log('💾 [BiometricService] Email:', email);
      const credentials: StoredCredentials = { email, password };
      
      if (Capacitor.isNativePlatform()) {
        // Use native secure storage - setCredentials will handle authentication automatically
        console.log('💾 [BiometricService] Calling native setCredentials...');
        await NativeBiometric.setCredentials({
          username: email,
          password: password,
          server: CREDENTIALS_KEY,
        });
        console.log('💾 [BiometricService] Saved to native storage');
        
        // Add another small delay after save to prevent immediate verification pressure
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        // For web, use localStorage (less secure but functional)
        // In production, you'd want to use a more secure method
        const encoded = btoa(JSON.stringify(credentials));
        localStorage.setItem(CREDENTIALS_KEY, encoded);
        console.log('💾 [BiometricService] Saved to localStorage');
      }
      
      console.log('✅ [BiometricService] Credentials saved successfully!');
    } catch (error) {
      console.error('❌ [BiometricService] Save failed:', error);
      throw new Error('No se pudieron guardar las credenciales');
    }
  }

  /**
   * Retrieve stored credentials
   */
  static async getCredentials(): Promise<StoredCredentials | null> {
    try {
      console.log('🔐 [BiometricService] Getting credentials from storage...');
      if (Capacitor.isNativePlatform()) {
        const result = await NativeBiometric.getCredentials({
          server: CREDENTIALS_KEY,
        });
        
        const credentials = {
          email: result.username,
          password: result.password,
        };
        console.log('🔐 [BiometricService] Found credentials:', credentials.email ? 'YES' : 'NO');
        return credentials;
      } else {
        // Web fallback
        const encoded = localStorage.getItem(CREDENTIALS_KEY);
        if (!encoded) {
          console.log('🔐 [BiometricService] Found credentials: NO');
          return null;
        }
        
        const credentials = JSON.parse(atob(encoded));
        console.log('🔐 [BiometricService] Found credentials:', credentials && credentials.email ? 'YES' : 'NO');
        return credentials;
      }
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      return null;
    }
  }

  /**
   * Delete stored credentials
   */
  static async deleteCredentials(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await NativeBiometric.deleteCredentials({
          server: CREDENTIALS_KEY,
        });
      } else {
        localStorage.removeItem(CREDENTIALS_KEY);
      }
    } catch (error) {
      console.error('Failed to delete credentials:', error);
    }
  }

  /**
   * Check if biometric login is enabled (has stored credentials)
   */
  static async isEnabled(): Promise<boolean> {
    try {
      const credentials = await this.getCredentials();
      const enabled = credentials !== null && 
                     credentials.email !== '' && 
                     credentials.password !== '';
      console.log('✅ [BiometricService] isEnabled:', enabled);
      return enabled;
    } catch (error) {
      console.error('Failed to check if biometric is enabled:', error);
      return false;
    }
  }
}
