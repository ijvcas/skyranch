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
        // Use WebAuthn for web platform
        console.log('🔐 [BiometricService] Starting WebAuthn authentication...');
        const authenticated = await WebAuthnHelper.authenticate();
        
        if (authenticated) {
          console.log('✅ [BiometricService] WebAuthn authentication successful');
        } else {
          console.log('❌ [BiometricService] WebAuthn authentication failed');
        }
        
        return authenticated;
      }

      // Native platform implementation
      console.log('🔐 [BiometricService] Starting native authentication...');

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
      console.log('✅ [BiometricService] Native authentication successful');

      return true;
    } catch (error: any) {
      if (error.code === 10 || error.code === 13) {
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
   * Save credentials securely (without WebAuthn registration on web)
   */
  static async saveCredentials(email: string, password: string, skipWebAuthnRegistration = false): Promise<void> {
    try {
      console.log('💾 [BiometricService] Saving credentials to storage...');
      const credentials: StoredCredentials = { email, password };
      
      if (Capacitor.isNativePlatform()) {
        // Native: Use secure keychain
        console.log('💾 [BiometricService] Calling native setCredentials...');
        await NativeBiometric.setCredentials({
          username: email,
          password: password,
          server: CREDENTIALS_KEY,
        });
        console.log('💾 [BiometricService] Saved to native storage');
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        // Web: Use localStorage only (WebAuthn registration must happen separately)
        const encoded = btoa(JSON.stringify(credentials));
        localStorage.setItem(CREDENTIALS_KEY, encoded);
        console.log('💾 [BiometricService] Saved to localStorage');
        
        if (!skipWebAuthnRegistration) {
          console.warn('⚠️ WebAuthn registration must be triggered separately with user gesture');
        }
      }
      
      console.log('✅ [BiometricService] Credentials saved successfully!');
    } catch (error) {
      console.error('❌ [BiometricService] Save failed:', error);
      throw new Error('No se pudieron guardar las credenciales');
    }
  }

  /**
   * Register WebAuthn credential (must be called from user gesture context)
   */
  static async registerWebAuthnCredential(userId: string): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      return true; // Not needed on native
    }
    
    try {
      console.log('🔐 [BiometricService] Registering WebAuthn credential...');
      const registered = await WebAuthnHelper.register(userId);
      if (registered) {
        console.log('✅ [BiometricService] WebAuthn credential registered successfully');
      } else {
        console.error('❌ [BiometricService] WebAuthn registration failed');
      }
      return registered;
    } catch (error) {
      console.error('❌ [BiometricService] WebAuthn registration error:', error);
      return false;
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
        WebAuthnHelper.clearCredential();
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

// WebAuthn helper for browser-based biometric authentication
class WebAuthnHelper {
  private static CREDENTIAL_ID_KEY = 'farmika_webauthn_credential_id';

  /**
   * Register a new WebAuthn credential (one-time setup)
   */
  static async register(userId: string): Promise<boolean> {
    try {
      console.log('🔐 [WebAuthn] Starting registration...');
      console.log('🔐 [WebAuthn] User ID:', userId);
      console.log('🔐 [WebAuthn] Hostname:', window.location.hostname);
      console.log('🔐 [WebAuthn] Protocol:', window.location.protocol);
      console.log('🔐 [WebAuthn] User Agent:', navigator.userAgent);
      
      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        console.error('❌ [WebAuthn] PublicKeyCredential not available');
        throw new Error('WebAuthn not supported in this browser');
      }
      
      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log('🔐 [WebAuthn] Platform authenticator available:', available);
      
      if (!available) {
        throw new Error('No platform authenticator (Touch ID/Face ID) available');
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      console.log('🔐 [WebAuthn] Calling navigator.credentials.create...');
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "FARMIKA",
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userId,
            displayName: userId
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },  // ES256
            { alg: -257, type: "public-key" } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "none"
        }
      }) as PublicKeyCredential;

      if (credential) {
        localStorage.setItem(
          this.CREDENTIAL_ID_KEY,
          btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
        );
        console.log('✅ [WebAuthn] Credential registered successfully');
        console.log('✅ [WebAuthn] Credential ID stored in localStorage');
        return true;
      }
      
      console.error('❌ [WebAuthn] No credential returned');
      return false;
    } catch (error: any) {
      console.error('❌ [WebAuthn] Registration failed:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'NotAllowedError') {
        console.error('❌ [WebAuthn] NotAllowedError - User cancelled, not in gesture context, or permission denied');
      } else if (error.name === 'NotSupportedError') {
        console.error('❌ [WebAuthn] NotSupportedError - WebAuthn not supported on this device/browser');
      } else if (error.name === 'SecurityError') {
        console.error('❌ [WebAuthn] SecurityError - Check HTTPS requirement or rpId configuration');
      } else if (error.name === 'InvalidStateError') {
        console.error('❌ [WebAuthn] InvalidStateError - Credential may already exist');
      } else if (error.name === 'AbortError') {
        console.error('❌ [WebAuthn] AbortError - Operation was aborted');
      }
      
      throw error; // Re-throw to propagate to caller
    }
  }

  /**
   * Authenticate using existing WebAuthn credential
   */
  static async authenticate(): Promise<boolean> {
    try {
      const credentialIdBase64 = localStorage.getItem(this.CREDENTIAL_ID_KEY);
      if (!credentialIdBase64) {
        console.error('❌ No WebAuthn credential ID found in storage');
        return false;
      }

      console.log('🔐 Found credential ID, requesting biometric authentication...');
      
      const credentialId = Uint8Array.from(atob(credentialIdBase64), c => c.charCodeAt(0));
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [{
            id: credentialId,
            type: 'public-key',
            transports: ['internal']
          }],
          userVerification: "required", // This triggers Face ID/Touch ID
          timeout: 60000
        }
      });

      if (assertion) {
        console.log('✅ Biometric authentication successful!');
        return true;
      }
      
      console.error('❌ No assertion returned');
      return false;
    } catch (error: any) {
      console.error('❌ WebAuthn authentication failed:', error);
      
      if (error.name === 'NotAllowedError') {
        console.error('User cancelled or permission denied');
      } else if (error.name === 'InvalidStateError') {
        console.error('Credential not recognized');
      }
      
      return false;
    }
  }

  /**
   * Check if WebAuthn credential exists
   */
  static hasCredential(): boolean {
    return !!localStorage.getItem(this.CREDENTIAL_ID_KEY);
  }

  /**
   * Remove WebAuthn credential
   */
  static clearCredential(): void {
    localStorage.removeItem(this.CREDENTIAL_ID_KEY);
  }
}
