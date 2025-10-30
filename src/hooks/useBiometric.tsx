import { useState, useEffect } from 'react';
import { BiometricService } from '@/services/biometricService';

export const useBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('none');
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBiometricStatus();
    
    // Re-check when page becomes visible (handles tab switching, app returning from background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkBiometricStatus();
      }
    };
    
    // Re-check when window gains focus (handles navigation, mobile app switching)
    const handleFocus = () => {
      checkBiometricStatus();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const checkBiometricStatus = async () => {
    try {
      console.log('🔄 [useBiometric] Checking biometric status...');
      setLoading(true);
      const available = await BiometricService.isAvailable();
      setIsAvailable(available);

      if (available) {
        const type = await BiometricService.getBiometricType();
        setBiometricType(type);
        
        const enabled = await BiometricService.isEnabled();
        console.log('🔄 [useBiometric] isEnabled:', enabled);
        setIsEnabled(enabled);
      }
    } catch (error) {
      console.error('Failed to check biometric status:', error);
    } finally {
      setLoading(false);
    }
  };

  const authenticate = async (): Promise<{ email: string; password: string } | null> => {
    try {
      // First verify identity
      const authenticated = await BiometricService.authenticate();
      if (!authenticated) {
        return null;
      }

      // Then get credentials
      const credentials = await BiometricService.getCredentials();
      return credentials;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return null;
    }
  };

  const enableBiometric = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 [useBiometric] Enabling biometric...');
      await BiometricService.saveCredentials(email, password);
      await checkBiometricStatus();
      console.log('✅ [useBiometric] Biometric enabled successfully');
      return true;
    } catch (error) {
      console.error('❌ [useBiometric] Error enabling biometric:', error);
      throw error;
    }
  };

  const disableBiometric = async (): Promise<void> => {
    try {
      await BiometricService.deleteCredentials();
      // Immediately refresh status instead of just setting state
      await checkBiometricStatus();
    } catch (error) {
      console.error('Failed to disable biometric:', error);
      throw error;
    }
  };

  const testBiometric = async (): Promise<boolean> => {
    return await BiometricService.authenticate('Prueba de autenticación biométrica');
  };

  return {
    isAvailable,
    biometricType,
    biometricTypeName: BiometricService.getBiometricTypeName(biometricType),
    isEnabled,
    loading,
    authenticate,
    enableBiometric,
    disableBiometric,
    testBiometric,
    refresh: checkBiometricStatus,
  };
};
