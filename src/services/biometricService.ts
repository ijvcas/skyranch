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
   * Note: Only available on native platforms (iOS/Android) for security reasons
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // Biometric authentication only supported on native platforms
      // Web browsers don't have secure credential storage equivalent to native keychain
      if (!Capacitor.isNativePlatform()) {
        return false;
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
   * Only works on native platforms (iOS/Android)
   */
  static async authenticate(reason: string = 'Iniciar sesión en FARMIKA'): Promise<boolean> {
    const startTime = Date.now();
    try {
      if (!Capacitor.isNativePlatform()) {
        console.error('❌ [BiometricService] Biometric authentication only available on native platforms');
        return false;
      }

      // Native platform implementation
      console.log('🔐 [BiometricService] Starting native authentication at', new Date().toISOString());
      console.log('🔐 [BiometricService] Reason:', reason);

      const authStart = Date.now();
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
      const authDuration = Date.now() - authStart;
      const totalDuration = Date.now() - startTime;
      console.log('✅ [BiometricService] Native authentication successful');
      console.log('⏱️  [BiometricService] Auth took:', authDuration, 'ms | Total:', totalDuration, 'ms');

      return true;
    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      if (error.code === 10 || error.code === 13) {
        console.log('❌ [BiometricService] User cancelled biometric authentication after', totalDuration, 'ms');
      } else if (error.message === 'Authentication timeout') {
        console.error('❌ [BiometricService] Authentication timeout after', totalDuration, 'ms');
      } else {
        console.error('❌ [BiometricService] Biometric authentication failed after', totalDuration, 'ms:', error);
      }
      return false;
    }
  }

  /**
   * Save credentials securely using native keychain
   * Only works on native platforms (iOS/Android)
   */
  static async saveCredentials(email: string, password: string): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Biometric authentication only available on native mobile platforms');
      }

      console.log('💾 [BiometricService] Saving credentials to native secure storage...');
      
      // Native: Use secure keychain (iOS Keychain / Android Keystore)
      console.log('💾 [BiometricService] Calling native setCredentials...');
      await NativeBiometric.setCredentials({
        username: email,
        password: password,
        server: CREDENTIALS_KEY,
      });
      console.log('💾 [BiometricService] Saved to native storage');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('✅ [BiometricService] Credentials saved successfully!');
    } catch (error) {
      console.error('❌ [BiometricService] Save failed:', error);
      throw new Error('No se pudieron guardar las credenciales');
    }
  }


  /**
   * Retrieve stored credentials from native keychain
   * Only works on native platforms (iOS/Android)
   */
  static async getCredentials(): Promise<StoredCredentials | null> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('🔐 [BiometricService] Biometric authentication only available on native platforms');
        return null;
      }

      console.log('🔐 [BiometricService] Getting credentials from native secure storage...');
      const result = await NativeBiometric.getCredentials({
        server: CREDENTIALS_KEY,
      });
      
      const credentials = {
        email: result.username,
        password: result.password,
      };
      console.log('🔐 [BiometricService] Found credentials:', credentials.email ? 'YES' : 'NO');
      return credentials;
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      return null;
    }
  }

  /**
   * Delete stored credentials from native keychain
   */
  static async deleteCredentials(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await NativeBiometric.deleteCredentials({
          server: CREDENTIALS_KEY,
        });
      }
      // No web implementation - credentials not stored on web for security
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
      const hasCredentials = credentials !== null && 
                            credentials.email !== '' && 
                            credentials.password !== '';
      
      console.log('✅ [BiometricService] isEnabled:', hasCredentials);
      return hasCredentials;
    } catch (error) {
      console.error('Failed to check if biometric is enabled:', error);
      return false;
    }
  }
}

